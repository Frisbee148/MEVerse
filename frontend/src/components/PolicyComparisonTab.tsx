import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { comparePolicies } from "../lib/api";
import type { CompareResult, TaskInfo } from "../lib/api";
import { C, fmt } from "../lib/colors";
import { Card, Explainer } from "./ui";

const POLICIES = ["Heuristic", "Always Allow", "Random"];
const METRICS: { key: keyof MetricRow; label: string; color: string }[] = [
  { key: "score", label: "Final Score", color: C.accent },
  { key: "detection", label: "Detection", color: C.blue },
  { key: "fp", label: "False Pos.", color: C.success },
  { key: "fn", label: "False Neg.", color: C.danger },
  { key: "health", label: "Health", color: C.info },
  { key: "overblock", label: "Overblock", color: C.warning },
];

interface MetricRow {
  score: number;
  detection: number;
  fp: number;
  fn: number;
  health: number;
  overblock: number;
}

export default function PolicyComparisonTab({ tasks }: { tasks: TaskInfo[] }) {
  const [task, setTask] = useState("full_market_surveillance");
  const [seed, setSeed] = useState(42);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);

  async function run() {
    setLoading(true);
    setError("");
    try {
      setResult(await comparePolicies(task, seed));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = result
    ? METRICS.map((m) => {
        const row: Record<string, number | string> = { metric: m.label };
        POLICIES.forEach((p) => {
          row[p] = (result.results[p] as unknown as Record<string, number>)[m.key];
        });
        return row;
      })
    : [];

  const bestPolicy = result
    ? POLICIES.reduce((a, b) => (result.results[a].score >= result.results[b].score ? a : b))
    : "";

  return (
    <div className="page">
      <p className="intro">
        Compare three baseline policies on the same episode (same task, same seed). This reveals
        which approach works best and why.
      </p>

      <Card>
        <div className="controls-row">
          <div className="field">
            <label htmlFor="compare-task">Task</label>
            <select id="compare-task" value={task} onChange={(e) => setTask(e.target.value)}>
              {tasks.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="compare-seed">Seed</label>
            <input
              id="compare-seed"
              type="number"
              min={1}
              max={999999}
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </div>
          <button id="compare-btn" className="btn" onClick={run} disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? "Comparing…" : "Compare"}
          </button>
        </div>
        {error && (
          <div className="error" style={{ marginTop: 14 }}>
            {error}
          </div>
        )}
      </Card>

      {result && (
        <>
          <Card title="Policy Comparison" className="" delay={0.05}>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid {...{ stroke: C.border }} vertical={false} />
                <XAxis dataKey="metric" stroke={C.muted} fontSize={11} />
                <YAxis domain={[0, 1]} stroke={C.muted} fontSize={11} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: C.text }}
                  labelStyle={{ color: C.text }}
                  formatter={(v: number | string) => fmt(Number(v))}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Heuristic" fill={C.accent} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Always Allow" fill={C.blue} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Random" fill={C.warning} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Explainer>
              Heuristic uses threshold rules and typically performs best. Always Allow never blocks
              anything (high false negatives). Random is unpredictable. Compare their shapes to
              understand the tradeoffs.
            </Explainer>
          </Card>

          <Card title="Summary Table" delay={0.1}>
            <table>
              <thead>
                <tr>
                  <th>Policy</th>
                  <th className="num">Score</th>
                  <th className="num">Detection</th>
                  <th className="num">FP</th>
                  <th className="num">FN</th>
                  <th className="num">Health</th>
                  <th className="num">Overblock</th>
                  <th className="num">Total Reward</th>
                </tr>
              </thead>
              <tbody>
                {POLICIES.map((p) => {
                  const r = result.results[p];
                  return (
                    <tr key={p} className={p === bestPolicy ? "best" : ""}>
                      <td>{p}</td>
                      <td className="num">{fmt(r.score)}</td>
                      <td className="num">{fmt(r.detection)}</td>
                      <td className="num">{fmt(r.fp)}</td>
                      <td className="num">{fmt(r.fn)}</td>
                      <td className="num">{fmt(r.health)}</td>
                      <td className="num">{fmt(r.overblock)}</td>
                      <td className="num">{fmt(r.totalReward)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
