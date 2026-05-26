import { useState } from "react";
import { runEpisode } from "../lib/api";
import type { EpisodeResult, TaskInfo } from "../lib/api";
import { C, diffClass, fmt } from "../lib/colors";
import {
  ActionDistribution,
  AmmEvolution,
  ConfusionMatrix,
  EpisodeLog,
  GradeRadar,
  GradeTable,
  RewardTimeline,
  SignalHeatmap,
} from "./charts";
import { Card, Explainer, Gauge, ProgressBar } from "./ui";

const POLICIES = ["Heuristic", "Always Allow", "Random"];

export default function EpisodeRunnerTab({ tasks }: { tasks: TaskInfo[] }) {
  const [task, setTask] = useState("full_market_surveillance");
  const [policy, setPolicy] = useState("Heuristic");
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EpisodeResult | null>(null);

  const taskInfo = tasks.find((t) => t.name === task);

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await runEpisode(task, policy, seed));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <p className="intro">
        Run a complete surveillance episode automatically. The selected policy makes all
        decisions. Review the results to understand how the policy performed at catching bots
        without harming normal traders.
      </p>

      <div className="layout">
        <div className="sidebar card">
          <div className="field">
            <label htmlFor="task-select">Task</label>
            <select id="task-select" value={task} onChange={(e) => setTask(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.title}
                </option>
              ))}
            </select>
            {taskInfo && (
              <div className="hint" style={{ marginTop: 8 }}>
                <span className={`badge ${diffClass(taskInfo.difficulty)}`}>{taskInfo.difficulty}</span>{" "}
                · {taskInfo.numSteps} steps
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="policy-select">Policy</label>
            <select id="policy-select" value={policy} onChange={(e) => setPolicy(e.target.value)}>
              {POLICIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="seed-input">Seed</label>
            <input
              id="seed-input"
              type="number"
              min={0}
              max={999999}
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
            <div className="hint">0 = random seed</div>
          </div>

          <button id="run-btn" className="btn" onClick={run} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Running…" : "Run Episode"}
          </button>
          {error && (
            <div className="error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </div>

        <div className="content-stack">
          {!result && !loading && (
            <Card>
              <div className="empty">Configure the run and click <b>Run Episode</b> to see results.</div>
            </Card>
          )}
          {result && <Results result={result} />}
        </div>
      </div>
    </div>
  );
}

function Results({ result }: { result: EpisodeResult }) {
  const { grade, episodeSummary: s, ammStates, signalMatrix, stepHistory } = result;
  return (
    <>
      {/* 1. Summary */}
      <Card title="Episode Summary">
        <div className="stat-grid" style={{ marginBottom: 18 }}>
          <Stat label="Task" value={s.taskTitle.replace(/^Task \d+ - /, "")} small />
          <Stat label="Difficulty" value={s.difficulty} small />
          <Stat label="Policy" value={s.policy} small />
          <Stat label="Seed" value={String(s.seed)} small />
          <Stat label="Steps" value={String(s.steps)} small />
          <Stat label="Total Reward" value={fmt(s.totalReward)} small />
          <Stat label="Avg / Step" value={fmt(s.avgReward)} small />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "6px 0 10px" }}>
          <span className="score-big">{fmt(grade.score)}</span>
          <span style={{ color: C.muted }}>Final Score {grade.score >= 0.6 ? "· Passing" : "· Below 0.6"}</span>
        </div>
        <ProgressBar value={grade.score} big />
        <div style={{ marginTop: 18 }}>
          <GradeTable grade={grade} />
        </div>
        <Explainer>
          A score ≥ 0.6 is passing. <b>Detection (50%)</b> measures how well the agent caught
          threats. <b>False Positive (20%)</b> penalizes flagging normal activity. Higher is
          better for all components.
        </Explainer>
      </Card>

      {/* 2. AMM gauges */}
      <Card title="AMM Final State">
        <div className="gauge-row">
          <Gauge value={s.finalAmm.price} min={50} max={150} label="Price" color={C.blue} delay={0} />
          <Gauge value={s.finalAmm.botConfidence} min={0} max={1} label="Bot Confidence" color={C.danger} delay={0.1} />
          <Gauge value={s.finalAmm.health} min={0} max={1} label="Health" color={C.success} delay={0.2} />
          <Gauge value={s.finalAmm.volatility} min={0} max={0.5} label="Volatility" color={C.warning} delay={0.3} />
        </div>
        <Explainer>
          Final state of the simulated market. Low <b>bot confidence</b> means the agent
          successfully deterred the bot. High <b>health</b> means normal trading wasn't disrupted.
        </Explainer>
      </Card>

      {/* 3. Reward timeline */}
      <Card title="Reward Timeline">
        <RewardTimeline steps={stepHistory} />
        <Explainer>
          Each bar shows the reward earned at that step, colored by what action the agent took.
          Green bars during normal periods and red bars during attacks means the agent is
          performing well. The dotted line tracks total accumulated reward.
        </Explainer>
      </Card>

      {/* 4. Action distribution */}
      <Card title="Action Distribution">
        <ActionDistribution steps={stepHistory} />
        <Explainer>
          Shows how many times each action was used, split by whether the activity was actually
          normal or suspicious. Ideally, ALLOW is mostly green (correct) and BLOCK is mostly red
          (caught threats).
        </Explainer>
      </Card>

      {/* 5. Signal heatmap */}
      <Card title="Signal Heatmap">
        <SignalHeatmap matrix={signalMatrix} />
        <Explainer>
          Surveillance signal intensity over time. Red/amber bands indicate periods of suspicious
          activity. A good agent should take BLOCK or FLAG actions when these bands appear.
        </Explainer>
      </Card>

      {/* 6. AMM evolution */}
      <Card title="AMM State Evolution">
        <AmmEvolution amm={ammStates} />
        <Explainer>
          How the market evolved during the episode. Bot confidence should trend downward if the
          agent is successfully blocking attacks. Health should stay high — drops mean the agent
          is accidentally blocking normal traders.
        </Explainer>
      </Card>

      {/* 7. Radar */}
      <Card title="Grade Radar">
        <GradeRadar grade={grade} />
        <Explainer>
          Shape of the agent's performance. A large balanced pentagon means a well-rounded policy.
          Spikes and dips reveal specific strengths and weaknesses.
        </Explainer>
      </Card>

      {/* 8. Confusion matrix */}
      <Card title="Confusion Matrix">
        <ConfusionMatrix steps={stepHistory} />
        <Explainer>
          The definitive accuracy chart. Top row should be heavy on ALLOW (correctly letting
          normal trades through). Bottom row should be heavy on BLOCK/FLAG (catching threats).
          Off-diagonal entries are errors.
        </Explainer>
      </Card>

      {/* 9. Log */}
      <Card title="Episode Log">
        <EpisodeLog steps={stepHistory} />
        <Explainer>
          Raw step-by-step trace showing what agents were active, signal intensities, and whether
          the surveillance decision was correct.
        </Explainer>
      </Card>
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value" style={small ? { fontSize: 15 } : undefined}>
        {value}
      </div>
    </div>
  );
}
