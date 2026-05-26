import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AmmStates, Grade, SignalRow, StepRecord } from "../lib/api";
import { ACTION_COLORS, C, fmt, heatColor } from "../lib/colors";

const AXIS = { stroke: C.muted, fontSize: 11 };
const GRID = { stroke: C.border };

function tooltipStyle() {
  return {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 12,
  };
}

// --------------------------------------------------------------- timeline
export function RewardTimeline({ steps }: { steps: StepRecord[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={steps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="step" {...AXIS} />
        <YAxis yAxisId="l" {...AXIS} domain={[0, 1]} />
        <YAxis yAxisId="r" orientation="right" {...AXIS} />
        <Tooltip
          contentStyle={tooltipStyle()}
          itemStyle={{ color: C.text }}
          labelStyle={{ color: C.text }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          formatter={(value: number | string, name: string, item: { payload?: StepRecord }) => {
            if (name === "reward") {
              const p = item?.payload;
              return [`${fmt(Number(value))} · ${p?.action} · ${p?.label}`, "reward"];
            }
            return [fmt(Number(value)), name];
          }}
        />
        <Bar yAxisId="l" dataKey="reward" radius={[2, 2, 0, 0]}>
          {steps.map((s, i) => (
            <Cell key={i} fill={ACTION_COLORS[s.action]} />
          ))}
        </Bar>
        <Line
          yAxisId="r"
          type="monotone"
          dataKey="cumReward"
          stroke={C.accent}
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={false}
          name="cumulative"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ----------------------------------------------------- action distribution
export function ActionDistribution({ steps }: { steps: StepRecord[] }) {
  const order = ["ALLOW", "FLAG", "BLOCK", "MONITOR"] as const;
  const data = order.map((action) => {
    const normal = steps.filter((s) => s.action === action && s.label === "normal").length;
    const suspicious = steps.filter((s) => s.action === action && s.label === "suspicious").length;
    return { action, normal, suspicious };
  });
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="action" {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: C.text }} labelStyle={{ color: C.text }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="normal" stackId="a" fill={C.success} name="normal" radius={[0, 0, 0, 0]} />
        <Bar dataKey="suspicious" stackId="a" fill={C.danger} name="suspicious" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --------------------------------------------------------------- heatmap
export function SignalHeatmap({ matrix }: { matrix: SignalRow[] }) {
  const normalized = (row: SignalRow): number[] => {
    if (row.name === "Frequency" || row.name === "Slippage") {
      const max = Math.max(...row.values, 1e-6);
      return row.values.map((v) => v / max);
    }
    return row.values.map((v) => Math.max(0, Math.min(1, v)));
  };
  return (
    <div className="heatmap">
      {matrix.map((row) => {
        const norm = normalized(row);
        return (
          <div className="heat-line" key={row.name}>
            <span className="heat-name">{row.name}</span>
            <div className="heat-cells">
              {norm.map((t, i) => (
                <div
                  key={i}
                  className="heat-cell"
                  style={{ background: heatColor(t) }}
                  title={`${row.name} · step ${i} · ${fmt(row.values[i], 3)}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------- amm evolution
export function AmmEvolution({ amm }: { amm: AmmStates }) {
  const data = amm.steps.map((step, i) => ({
    step,
    price: amm.price[i],
    liquidity: amm.liquidity[i],
    botConfidence: amm.botConfidence[i],
    volatility: amm.volatility[i],
    health: amm.health[i],
  }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey="step" {...AXIS} />
          <YAxis yAxisId="l" {...AXIS} />
          <YAxis yAxisId="r" orientation="right" {...AXIS} />
          <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: C.text }} labelStyle={{ color: C.text }} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: number | string) => fmt(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line yAxisId="l" type="monotone" dataKey="price" stroke={C.blue} strokeWidth={2} dot={false} name="Price" />
          <Line
            yAxisId="r"
            type="monotone"
            dataKey="liquidity"
            stroke={C.accent}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            name="Liquidity"
          />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={210}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey="step" {...AXIS} />
          <YAxis {...AXIS} domain={[0, 1]} />
          <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: C.text }} labelStyle={{ color: C.text }} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: number | string) => fmt(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="botConfidence" stroke={C.danger} strokeWidth={2} dot={false} name="Bot Confidence" />
          <Line type="monotone" dataKey="volatility" stroke={C.warning} strokeWidth={2} strokeDasharray="2 3" dot={false} name="Volatility" />
          <Line type="monotone" dataKey="health" stroke={C.success} strokeWidth={2} strokeDasharray="6 3 2 3" dot={false} name="Health" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------- radar
export function GradeRadar({ grade }: { grade: Grade }) {
  const data = [
    { axis: "Detection", v: grade.detection },
    { axis: "False Positive", v: grade.falsePositive },
    { axis: "False Negative", v: grade.falseNegative },
    { axis: "Health", v: grade.health },
    { axis: "Overblocking", v: grade.overblocking },
  ];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke={C.border} />
        <PolarAngleAxis dataKey="axis" tick={{ fill: C.muted, fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 1]} tick={{ fill: C.muted, fontSize: 10 }} angle={90} />
        <Radar dataKey="v" stroke={C.accent} fill={C.accent} fillOpacity={0.35} strokeWidth={2} />
        <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: C.text }} labelStyle={{ color: C.text }} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: number | string) => fmt(Number(v))} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ------------------------------------------------------- confusion matrix
export function ConfusionMatrix({ steps }: { steps: StepRecord[] }) {
  const cols = ["ALLOW", "MONITOR", "FLAG", "BLOCK"] as const;
  const rows = ["normal", "suspicious"] as const;
  const counts: Record<string, Record<string, number>> = {
    normal: { ALLOW: 0, MONITOR: 0, FLAG: 0, BLOCK: 0 },
    suspicious: { ALLOW: 0, MONITOR: 0, FLAG: 0, BLOCK: 0 },
  };
  steps.forEach((s) => {
    counts[s.label][s.action] += 1;
  });
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => counts[r][c])));
  // Correct cells: normal->ALLOW/MONITOR, suspicious->FLAG/BLOCK.
  const good = (r: string, c: string) =>
    (r === "normal" && (c === "ALLOW" || c === "MONITOR")) ||
    (r === "suspicious" && (c === "FLAG" || c === "BLOCK"));
  return (
    <div className="confusion">
      <div className="corner" />
      {cols.map((c) => (
        <div className="colhead" key={c}>
          {c}
        </div>
      ))}
      {rows.map((r) => (
        <Row key={r} r={r} cols={cols} counts={counts[r]} max={max} good={good} />
      ))}
    </div>
  );
}

function Row({
  r,
  cols,
  counts,
  max,
  good,
}: {
  r: string;
  cols: readonly string[];
  counts: Record<string, number>;
  max: number;
  good: (r: string, c: string) => boolean;
}) {
  return (
    <>
      <div className="rowhead">{r}</div>
      {cols.map((c) => {
        const n = counts[c];
        const intensity = n / max;
        const base = good(r, c) ? "0, 201, 167" : "255, 71, 87";
        return (
          <div
            key={c}
            className="cell"
            style={{ background: `rgba(${base}, ${0.12 + intensity * 0.75})` }}
          >
            {n}
          </div>
        );
      })}
    </>
  );
}

// ------------------------------------------------------------ grade table
const GRADE_COMPONENTS: { key: keyof Grade; label: string; weight: string }[] = [
  { key: "detection", label: "Detection", weight: "50%" },
  { key: "falsePositive", label: "False Positive", weight: "20%" },
  { key: "falseNegative", label: "False Negative", weight: "15%" },
  { key: "health", label: "Health", weight: "10%" },
  { key: "overblocking", label: "Overblocking", weight: "5%" },
];

export function GradeTable({ grade }: { grade: Grade }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th className="num">Weight</th>
          <th className="num">Score</th>
        </tr>
      </thead>
      <tbody>
        {GRADE_COMPONENTS.map((c) => (
          <tr key={c.key}>
            <td>{c.label}</td>
            <td className="num">{c.weight}</td>
            <td className="num">{fmt(grade[c.key])}</td>
          </tr>
        ))}
        <tr style={{ fontWeight: 700 }}>
          <td>Final Score</td>
          <td className="num">100%</td>
          <td className="num" style={{ color: C.accent }}>
            {fmt(grade.score)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// -------------------------------------------------------------- episode log
function bar(v: number): string {
  const filled = Math.round(Math.max(0, Math.min(1, v)) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function verdict(label: string, action: string): { text: string; cls: string } {
  if (label === "suspicious") {
    if (action === "BLOCK" || action === "FLAG") return { text: "✅ CAUGHT THREAT", cls: "ln-allow" };
    if (action === "MONITOR") return { text: "⚠️ WATCHING", cls: "ln-flag" };
    return { text: "❌ MISSED THREAT", cls: "ln-block" };
  }
  if (action === "ALLOW") return { text: "✅ CORRECT ALLOW", cls: "ln-allow" };
  if (action === "MONITOR") return { text: "⚪ MONITOR", cls: "ln-muted" };
  return { text: "❌ FALSE POSITIVE", cls: "ln-block" };
}

export function EpisodeLog({ steps }: { steps: StepRecord[] }) {
  const threat = steps.filter((s) => s.label === "suspicious").length;
  const detections = steps.filter((s) => s.label === "suspicious" && (s.action === "BLOCK" || s.action === "FLAG")).length;
  const correctBlocks = steps.filter((s) => s.label === "suspicious" && s.action === "BLOCK").length;
  const falsePos = steps.filter((s) => s.label === "normal" && (s.action === "BLOCK" || s.action === "FLAG")).length;
  const missed = steps.filter((s) => s.label === "suspicious" && s.action === "ALLOW").length;
  const flagged = steps.filter((s) => s.action === "BLOCK" || s.action === "FLAG").length;
  const precision = flagged ? detections / flagged : 0;
  const recall = threat ? detections / threat : 0;

  return (
    <div className="log">
      {steps.map((s) => {
        const v = verdict(s.label, s.action);
        const aCls = `ln-${s.action.toLowerCase()}`;
        return (
          <div key={s.step}>
            <span className="ln-head">{`Step ${String(s.step).padStart(2, "0")} | Block #${s.block}`}</span>
            {"\n"}
            <span className="ln-muted">{`Active agents: ${s.activeAgents.join(" · ") || "—"}`}</span>
            {"\n"}
            <span className="ln-muted">{`burst   : ${fmt(s.signals.burst)}  ${bar(s.signals.burst)}`}</span>
            {"\n"}
            <span className="ln-muted">{`pattern : ${fmt(s.signals.pattern)}  ${bar(s.signals.pattern)}`}</span>
            {"\n"}
            <span className={aCls}>{`Action: ${s.action.padEnd(8)}`}</span>
            <span className={v.cls}>{`  ${v.text}`}</span>
            <span className="ln-muted">{`    Reward: ${s.reward >= 0 ? "+" : ""}${fmt(s.reward)}`}</span>
            {"\n\n"}
          </div>
        );
      })}
      <div className="ln-head">{"──────────── SUMMARY ────────────"}</div>
      <span className="ln-muted">{`Total steps     : ${steps.length}`}</span>
      {"\n"}
      <span className="ln-muted">{`Threat steps    : ${threat}`}</span>
      {"\n"}
      <span className="ln-muted">{`Correct blocks  : ${correctBlocks}`}</span>
      {"\n"}
      <span className="ln-muted">{`False positives : ${falsePos}`}</span>
      {"\n"}
      <span className="ln-muted">{`Missed threats  : ${missed}`}</span>
      {"\n"}
      <span className="ln-muted">{`Precision       : ${fmt(precision)}`}</span>
      {"\n"}
      <span className="ln-muted">{`Recall          : ${fmt(recall)}`}</span>
    </div>
  );
}
