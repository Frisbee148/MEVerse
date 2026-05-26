import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { playgroundGrade, playgroundReset, playgroundStep } from "../lib/api";
import type { Grade, Observation, TaskInfo } from "../lib/api";
import { ACTIONS, C, diffClass, fmt } from "../lib/colors";
import { GradeTable } from "./charts";
import { Card, Explainer, ProgressBar } from "./ui";

export default function PlaygroundTab({ tasks }: { tasks: TaskInfo[] }) {
  const [task, setTask] = useState("burst_detection");
  const [action, setAction] = useState("ALLOW");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [obs, setObs] = useState<Observation | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const taskInfo = tasks.find((t) => t.name === task);

  async function reset() {
    setBusy(true);
    setError("");
    setGrade(null);
    setLastReward(null);
    setDone(false);
    try {
      const r = await playgroundReset(task, 0);
      setSessionId(r.sessionId);
      setObs(r.observation);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function step() {
    if (!sessionId) return;
    setBusy(true);
    setError("");
    try {
      const r = await playgroundStep(sessionId, action);
      setObs(r.observation);
      setLastReward(r.reward);
      setDone(r.done);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function grade_() {
    if (!sessionId) return;
    setBusy(true);
    setError("");
    try {
      const r = await playgroundGrade(sessionId);
      setGrade(r.grade);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <p className="intro">
        Manually interact with the market surveillance environment. Select an action each step
        based on the trading signals you see. Try to BLOCK suspicious bot activity while ALLOWing
        normal trades.
      </p>

      <div className="layout">
        <div className="sidebar card">
          <div className="field">
            <label htmlFor="playground-task">Task</label>
            <select id="playground-task" value={task} onChange={(e) => setTask(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.title}
                </option>
              ))}
            </select>
            {taskInfo && (
              <div className="hint" style={{ marginTop: 8 }}>
                <span className={`badge ${diffClass(taskInfo.difficulty)}`}>{taskInfo.difficulty}</span> ·{" "}
                {taskInfo.numSteps} steps
              </div>
            )}
          </div>

          <button id="playground-reset" className="btn secondary" onClick={reset} disabled={busy}>
            {busy ? <span className="spinner" /> : null} Reset Episode
          </button>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="playground-action">Action</label>
            <select
              id="playground-action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              disabled={!sessionId || done}
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="btn-row">
            <button id="playground-step" className="btn" onClick={step} disabled={!sessionId || done || busy}>
              Step
            </button>
            <button id="playground-grade" className="btn secondary" onClick={grade_} disabled={!sessionId || busy}>
              Grade
            </button>
          </div>

          {lastReward !== null && (
            <div className="stat" style={{ marginTop: 16 }}>
              <div className="label">Last Reward</div>
              <div className="value" style={{ color: C.accent }}>
                {fmt(lastReward)}
              </div>
            </div>
          )}
          {done && (
            <div className="hint" style={{ marginTop: 12, color: C.warning }}>
              Episode finished — click Grade for the final score.
            </div>
          )}
          {error && (
            <div className="error" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
        </div>

        <div className="content-stack">
          {!obs && (
            <Card>
              <div className="empty">
                Click <b>Reset Episode</b> to start interacting with the environment.
              </div>
            </Card>
          )}
          {obs && <ObservationView obs={obs} />}
          {grade && (
            <Card title="Final Grade">
              <GradeTable grade={grade} />
              <Explainer>
                Five-component breakdown of your run. Detection is weighted highest (50%). A final
                score ≥ 0.6 is passing.
              </Explainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ObservationView({ obs }: { obs: Observation }) {
  return (
    <Card title="Observation" subtitle={obs.scenarioNote}>
      <Group title="Market State">
        <KV k="AMM Price" v={fmt(obs.currentAmmPrice)} />
        <KV k="Pool Liquidity" v={fmt(obs.liquiditySnapshot, 0)} />
      </Group>

      <Group title="Trading Activity">
        <KV k="Trade Count" v={String(obs.recentTradeCount)} />
        <KV k="Trade Frequency" v={fmt(obs.tradeFrequency)} />
        <KV k="Avg Trade Size" v={fmt(obs.averageTradeSize)} />
        <KV k="Max Trade Size" v={fmt(obs.maximumTradeSize)} />
        <KV k="Slippage Impact" v={fmt(obs.recentSlippageImpact, 4)} />
      </Group>

      <Group title="Time Analysis">
        <KV k="Time Gap Mean" v={fmt(obs.timeGapMean)} />
        <KV k="Time Gap Min" v={fmt(obs.timeGapMin)} />
      </Group>
      <div className="obs-group">
        <div className="kv" style={{ marginBottom: 12 }}>
          <div className="k">Recent Time Gaps</div>
          <div className="chips" style={{ marginTop: 6 }}>
            {obs.recentTimeGaps.map((g, i) => (
              <span className="chip" key={i}>
                {fmt(g)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="obs-group">
        <h4>Threat Signals</h4>
        <Signal label="Burst Indicator" value={obs.burstIndicator} color={C.warning} />
        <Signal label="Pattern Indicator" value={obs.patternIndicator} color={C.info} />
        <Signal label="Suspiciousness" value={obs.suspiciousnessScore} color={C.danger} />
        <Signal label="Manipulation" value={obs.manipulationScore} color={C.danger} />
      </div>

      <div className="obs-group">
        <h4>Episode Progress</h4>
        <div className="kv-grid">
          <KV k="Step" v={`${obs.stepNum} / ${obs.maxSteps}`} />
          <KV k="Task" v={obs.taskName} />
        </div>
      </div>

      <div className="two-col">
        <div>
          <h4 style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Recent Trades</h4>
          <MiniBars values={obs.tradesInWindow} color={C.accent} />
        </div>
        <div>
          <h4 style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Recent Price Impacts</h4>
          <MiniBars values={obs.recentPriceImpacts} color={C.danger} />
        </div>
      </div>

      <Explainer>
        These are the raw signals for the current step. Higher <b>burst</b>, <b>suspiciousness</b>,
        and <b>manipulation</b> scores point to bot activity — those are the moments to FLAG or
        BLOCK. Calm signals mean it is safe to ALLOW.
      </Explainer>
    </Card>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="obs-group">
      <h4>{title}</h4>
      <div className="kv-grid">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function Signal({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="signal-row">
      <span style={{ color: C.muted }}>{label}</span>
      <ProgressBar value={value} color={color} />
      <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</span>
    </div>
  );
}

function MiniBars({ values, color }: { values: number[]; color: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="i" hide />
        <Tooltip
          contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
          itemStyle={{ color: C.text }}
          labelStyle={{ color: C.text }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(v: number | string) => fmt(Number(v), 4)}
        />
        <Bar dataKey="v" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
