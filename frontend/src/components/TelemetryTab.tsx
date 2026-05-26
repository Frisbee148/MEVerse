import { useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { parseTelemetry } from "../lib/api";
import type { TelemetryResult } from "../lib/api";
import { ACTION_COLORS, C, fmt } from "../lib/colors";
import { Card, Explainer } from "./ui";

export default function TelemetryTab() {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TelemetryResult | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".jsonl")) {
      setError("Please upload a .jsonl file.");
      return;
    }
    setLoading(true);
    setError("");
    setFileName(file.name);
    try {
      setResult(await parseTelemetry(file));
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <p className="intro">
        Upload a .jsonl telemetry file from a previous run to replay and visualize the agent's
        performance. Generate telemetry files by running:{" "}
        <code style={{ color: C.accent }}>DEBUG_TELEMETRY=1 python inference.py</code>
      </p>

      <Card>
        <div
          id="telem-upload"
          className={`dropzone ${drag ? "drag" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          {loading ? (
            <span>
              <span className="spinner" style={{ borderTopColor: C.accent }} /> Parsing {fileName}…
            </span>
          ) : (
            <>
              <div style={{ fontSize: 16, marginBottom: 6 }}>
                <strong>Drop a .jsonl file here</strong> or click to browse
              </div>
              <div>{fileName ? `Loaded: ${fileName}` : "Telemetry from DEBUG_TELEMETRY runs"}</div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".jsonl"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
        {error && (
          <div className="error" style={{ marginTop: 14 }}>
            {error}
          </div>
        )}
      </Card>

      {result && (
        <>
          <Card title="Summary" delay={0.05}>
            <div className="stat-grid">
              <Stat label="Task" value={result.summary.task ?? "—"} />
              <Stat label="Model" value={result.summary.model ?? "—"} />
              <Stat label="Steps" value={String(result.summary.steps)} />
              <Stat label="Total Reward" value={fmt(result.summary.totalReward)} />
              <Stat
                label="Final Score"
                value={result.summary.finalScore != null ? fmt(result.summary.finalScore) : "—"}
              />
            </div>
            <Explainer>
              High-level summary of the replayed run. <b>Final Score</b> ≥ 0.6 is passing.{" "}
              <b>Total Reward</b> is the sum of per-step rewards.
            </Explainer>
          </Card>

          <Card title="Per-Step Rewards" delay={0.1}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={result.steps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={C.border} vertical={false} />
                <XAxis dataKey="step" stroke={C.muted} fontSize={11} />
                <YAxis domain={[0, 1]} stroke={C.muted} fontSize={11} />
                <Tooltip
                  contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number | string, _n, item: { payload?: { action?: string; label?: string } }) => [
                    `${fmt(Number(v))} · ${item?.payload?.action} · ${item?.payload?.label}`,
                    "reward",
                  ]}
                />
                <Bar dataKey="reward" radius={[2, 2, 0, 0]}>
                  {result.steps.map((s, i) => (
                    <Cell key={i} fill={ACTION_COLORS[s.action]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Explainer>
              Each bar is the reward earned at that step, colored by the action taken (ALLOW=green,
              FLAG=amber, BLOCK=red, MONITOR=blue). Tall bars mean the agent made the right call for
              that step.
            </Explainer>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: 15 }}>
        {value}
      </div>
    </div>
  );
}
