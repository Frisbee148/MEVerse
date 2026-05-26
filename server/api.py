"""FastAPI backend for the TradeX Surveillance Dashboard.

Drives the existing meverse market-surveillance environment, exposes JSON
endpoints for the React frontend, and serves the built static assets.
"""

from __future__ import annotations

import json
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from meverse.baseline_policy import choose_surveillance_action
from meverse.models import SurveillanceAction
from meverse.server.meverse_environment import MarketSurveillanceEnvironment
from meverse.tasks import list_task_names, task_definition

ACTIONS = ["ALLOW", "FLAG", "BLOCK", "MONITOR"]

TASK_META = {
    "burst_detection": {"steps": 50, "botConfidence": 0.25,
                        "description": "Catch sudden high-frequency trading bursts."},
    "pattern_manipulation_detection": {"steps": 50, "botConfidence": 0.35,
                        "description": "Detect rhythmic timing/size coordination."},
    "full_market_surveillance": {"steps": 60, "botConfidence": 0.30,
                        "description": "Handle both burst and pattern threats with noise."},
}

ROOT = Path(__file__).resolve().parent.parent
DIST = Path(os.environ.get("TRADEX_DIST") or (ROOT / "frontend" / "dist"))

app = FastAPI(title="TradeX Surveillance Dashboard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory playground sessions (single-process HF Space).
_SESSIONS: Dict[str, MarketSurveillanceEnvironment] = {}


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _difficulty(task: str) -> str:
    return task_definition(task).difficulty.capitalize()


def _grade_camel(grade: Dict[str, Any]) -> Dict[str, float]:
    return {
        "score": grade["score"],
        "detection": grade["detection_score"],
        "falsePositive": grade["false_positive_score"],
        "falseNegative": grade["false_negative_score"],
        "health": grade["health_score"],
        "overblocking": grade["overblocking_score"],
    }


def _serialize_obs(obs) -> Dict[str, Any]:
    meta = obs.metadata or {}
    return {
        "currentAmmPrice": obs.current_amm_price,
        "liquiditySnapshot": obs.liquidity_snapshot,
        "recentTradeCount": obs.recent_trade_count,
        "tradesInWindow": obs.trades_in_window,
        "tradeFrequency": obs.trade_frequency,
        "averageTradeSize": obs.average_trade_size,
        "maximumTradeSize": obs.maximum_trade_size,
        "recentSlippageImpact": obs.recent_slippage_impact,
        "timeGapMean": obs.time_gap_mean,
        "timeGapMin": obs.time_gap_min,
        "recentTimeGaps": obs.recent_time_gaps,
        "recentPriceImpacts": obs.recent_price_impacts,
        "suspiciousnessScore": obs.suspiciousness_score,
        "manipulationScore": obs.manipulation_score,
        "burstIndicator": float(meta.get("burst_indicator") or 0.0),
        "patternIndicator": float(meta.get("pattern_indicator") or 0.0),
        "stepNum": obs.step_num,
        "maxSteps": obs.max_steps,
        "taskName": obs.task_name,
        "scenarioNote": meta.get("scenario_note", ""),
        "done": bool(obs.done),
        "reward": float(obs.reward or 0.0),
    }


def _pick_action(policy: str, obs, rng: random.Random) -> str:
    if policy == "Always Allow":
        return "ALLOW"
    if policy == "Random":
        return rng.choice(ACTIONS)
    return choose_surveillance_action(obs)


def _run_episode(task: str, policy: str, seed: int) -> Dict[str, Any]:
    if task not in list_task_names():
        raise HTTPException(400, f"Unknown task: {task}")
    actual_seed = None if seed in (0, None) else int(seed)
    env = MarketSurveillanceEnvironment(task=task)
    obs = env.reset(seed=actual_seed)
    used_seed = env._seed
    rng = random.Random(used_seed)
    tdef = task_definition(task)

    step_history: List[Dict[str, Any]] = []
    amm = {k: [] for k in ("steps", "price", "liquidity", "botConfidence", "volatility", "health")}
    sig = {k: [] for k in ("burst", "pattern", "suspicion", "manipulation", "frequency", "slippage")}
    cum = 0.0

    init = env.debug_snapshot()["amm_state"]
    amm["steps"].append(0)
    amm["price"].append(init["price"])
    amm["liquidity"].append(init["liquidity"])
    amm["botConfidence"].append(init["bot_confidence"])
    amm["volatility"].append(init["volatility"])
    amm["health"].append(init["health_index"])

    done = False
    while not done:
        snap = env.debug_snapshot()
        cur = snap.get("current_step") or {}
        label = cur.get("label", "normal")
        active = list(snap["ground_truth"]["active_agents"])
        step_idx = obs.step_num
        signals = {
            "burst": float((obs.metadata or {}).get("burst_indicator") or 0.0),
            "pattern": float((obs.metadata or {}).get("pattern_indicator") or 0.0),
            "suspicion": float(obs.suspiciousness_score),
            "manipulation": float(obs.manipulation_score),
            "frequency": float(obs.trade_frequency),
            "slippage": float(obs.recent_slippage_impact),
        }

        action = _pick_action(policy, obs, rng)
        obs = env.step(SurveillanceAction(action_type=action))
        reward = float(obs.reward or 0.0)
        cum += reward
        done = bool(obs.done)

        post = env.debug_snapshot()["amm_state"]
        amm["steps"].append(step_idx + 1)
        amm["price"].append(post["price"])
        amm["liquidity"].append(post["liquidity"])
        amm["botConfidence"].append(post["bot_confidence"])
        amm["volatility"].append(post["volatility"])
        amm["health"].append(post["health_index"])

        for k in sig:
            sig[k].append(round(signals[k], 4))

        step_history.append({
            "step": step_idx,
            "block": 18500001 + step_idx,
            "action": action,
            "label": label,
            "reward": round(reward, 4),
            "cumReward": round(cum, 4),
            "activeAgents": active,
            "signals": {k: round(v, 4) for k, v in signals.items()},
        })

    grade = env.grade()
    n = max(1, len(step_history))
    summary = {
        "task": task,
        "taskTitle": tdef.title,
        "difficulty": tdef.difficulty.capitalize(),
        "policy": policy,
        "seed": used_seed,
        "steps": len(step_history),
        "totalReward": round(cum, 4),
        "avgReward": round(cum / n, 4),
        "finalAmm": {
            "price": amm["price"][-1],
            "botConfidence": amm["botConfidence"][-1],
            "health": amm["health"][-1],
            "volatility": amm["volatility"][-1],
        },
    }
    signal_matrix = [{"name": label, "values": sig[key]} for label, key in [
        ("Burst", "burst"), ("Pattern", "pattern"), ("Suspicion", "suspicion"),
        ("Manipulation", "manipulation"), ("Frequency", "frequency"), ("Slippage", "slippage"),
    ]]

    return {
        "grade": _grade_camel(grade),
        "stepHistory": step_history,
        "ammStates": amm,
        "signalMatrix": signal_matrix,
        "episodeSummary": summary,
        "stepRecords": step_history,
    }


# --------------------------------------------------------------------------- #
# Request models
# --------------------------------------------------------------------------- #
class RunEpisodeReq(BaseModel):
    task: str
    policy: str = "Heuristic"
    seed: int = 42


class CompareReq(BaseModel):
    task: str
    seed: int = 42


class ResetReq(BaseModel):
    task: str
    seed: Optional[int] = None


class StepReq(BaseModel):
    sessionId: str
    action: str


class GradeReq(BaseModel):
    sessionId: str


# --------------------------------------------------------------------------- #
# API endpoints
# --------------------------------------------------------------------------- #
@app.get("/api/tasks")
def get_tasks() -> List[Dict[str, Any]]:
    out = []
    for name in list_task_names():
        tdef = task_definition(name)
        meta = TASK_META.get(name, {})
        out.append({
            "name": name,
            "title": tdef.title,
            "difficulty": tdef.difficulty.capitalize(),
            "numSteps": tdef.num_steps,
            "description": meta.get("description", tdef.description),
        })
    return out


@app.post("/api/run-episode")
def run_episode(req: RunEpisodeReq) -> Dict[str, Any]:
    return _run_episode(req.task, req.policy, req.seed)


@app.post("/api/compare-policies")
def compare_policies(req: CompareReq) -> Dict[str, Any]:
    results: Dict[str, Any] = {}
    for policy in ["Heuristic", "Always Allow", "Random"]:
        ep = _run_episode(req.task, policy, req.seed)
        g = ep["grade"]
        results[policy] = {
            "score": g["score"],
            "detection": g["detection"],
            "fp": g["falsePositive"],
            "fn": g["falseNegative"],
            "health": g["health"],
            "overblock": g["overblocking"],
            "totalReward": ep["episodeSummary"]["totalReward"],
        }
    return {"results": results, "task": req.task, "seed": req.seed}


@app.post("/api/parse-telemetry")
async def parse_telemetry(file: UploadFile = File(...)) -> Dict[str, Any]:
    raw = (await file.read()).decode("utf-8", errors="replace")
    steps: List[Dict[str, Any]] = []
    summary: Dict[str, Any] = {"task": None, "model": None, "steps": 0,
                               "totalReward": 0.0, "finalScore": None}
    total = 0.0
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        event = rec.get("event")
        if event == "episode_start":
            summary["model"] = rec.get("model")
            summary["task"] = rec.get("task")
        elif event == "step":
            action = str(rec.get("action", "")).strip().upper()
            reward = float(rec.get("reward") or 0.0)
            pre = (rec.get("pre_action_environment") or {}).get("current_step") or {}
            steps.append({
                "step": rec.get("step", len(steps) + 1),
                "action": action if action in ACTIONS else "MONITOR",
                "reward": round(reward, 4),
                "label": pre.get("label", "normal"),
            })
            total += reward
        elif event == "episode_end":
            grade = rec.get("grade") or {}
            summary["finalScore"] = grade.get("score")
            summary["steps"] = rec.get("steps", len(steps))
            if summary["task"] is None:
                summary["task"] = grade.get("task")

    if not steps and summary["finalScore"] is None:
        raise HTTPException(400, "No recognizable telemetry events found in file.")
    summary["steps"] = summary["steps"] or len(steps)
    summary["totalReward"] = round(total, 4)
    return {"steps": steps, "summary": summary}


@app.post("/api/playground/reset")
def playground_reset(req: ResetReq) -> Dict[str, Any]:
    if req.task not in list_task_names():
        raise HTTPException(400, f"Unknown task: {req.task}")
    env = MarketSurveillanceEnvironment(task=req.task)
    seed = None if (req.seed in (0, None)) else int(req.seed)
    obs = env.reset(seed=seed)
    sid = str(uuid4())
    _SESSIONS[sid] = env
    # Bound session memory.
    if len(_SESSIONS) > 200:
        for k in list(_SESSIONS)[:50]:
            _SESSIONS.pop(k, None)
    return {"observation": _serialize_obs(obs), "sessionId": sid}


@app.post("/api/playground/step")
def playground_step(req: StepReq) -> Dict[str, Any]:
    env = _SESSIONS.get(req.sessionId)
    if env is None:
        raise HTTPException(404, "Session not found. Reset to start a new episode.")
    action = req.action.strip().upper()
    if action not in ACTIONS:
        raise HTTPException(400, f"Invalid action: {req.action}")
    obs = env.step(SurveillanceAction(action_type=action))
    return {
        "observation": _serialize_obs(obs),
        "reward": float(obs.reward or 0.0),
        "done": bool(obs.done),
    }


@app.post("/api/playground/grade")
def playground_grade(req: GradeReq) -> Dict[str, Any]:
    env = _SESSIONS.get(req.sessionId)
    if env is None:
        raise HTTPException(404, "Session not found. Reset to start a new episode.")
    return {"grade": _grade_camel(env.grade())}


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


# --------------------------------------------------------------------------- #
# Static frontend (mounted last so /api/* takes priority)
# --------------------------------------------------------------------------- #
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(DIST), html=True), name="static")
else:
    @app.get("/")
    def _no_build() -> JSONResponse:
        return JSONResponse(
            {"detail": f"Frontend build not found at {DIST}. Run the Vite build first."},
            status_code=503,
        )


def main(host: str = "0.0.0.0", port: int = 7860) -> None:
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
