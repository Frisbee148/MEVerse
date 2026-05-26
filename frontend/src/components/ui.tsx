import type { ReactNode } from "react";
import type { ActionType } from "../lib/api";
import { ACTION_COLORS } from "../lib/colors";

/** Plain-English note attached to every visualization. */
export function Explainer({ children }: { children: ReactNode }) {
  return (
    <div className="explainer">
      📝 {children}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  children,
  className = "",
  delay = 0,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`card fade-up ${className}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {title && <div className="card-title">{title}</div>}
      {subtitle && <div className="card-sub">{subtitle}</div>}
      {children}
    </div>
  );
}

export function ActionBadge({ action }: { action: ActionType }) {
  return (
    <span className="action-badge" style={{ background: ACTION_COLORS[action] }}>
      {action}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 1,
  color = "var(--color-accent)",
  big = false,
}: {
  value: number;
  max?: number;
  color?: string;
  big?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`pbar ${big ? "big" : ""}`}>
      <span style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

/** Radial gauge built with a single conic-gradient ring. */
export function Gauge({
  value,
  min,
  max,
  label,
  unit = "",
  color,
  delay = 0,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  unit?: string;
  color: string;
  delay?: number;
}) {
  const frac = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const deg = frac * 360;
  return (
    <div className="gauge pop-in" style={delay ? { animationDelay: `${delay}s` } : undefined}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: "50%",
          margin: "0 auto",
          background: `conic-gradient(${color} ${deg}deg, var(--color-border) ${deg}deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 74,
            height: 74,
            borderRadius: "50%",
            background: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span className="gauge-value" style={{ color }}>
            {value.toFixed(unit === "" && max <= 1 ? 2 : 1)}
            {unit}
          </span>
        </div>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}
