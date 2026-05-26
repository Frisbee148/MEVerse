import type { ActionType, Label } from "./api";

export const ACTION_COLORS: Record<ActionType, string> = {
  ALLOW: "#2ed573",
  FLAG: "#ffa502",
  BLOCK: "#ff4757",
  MONITOR: "#3498db",
};

export const LABEL_COLORS: Record<Label, string> = {
  normal: "#2ed573",
  suspicious: "#ff4757",
};

export const C = {
  accent: "#3b82f6",
  blue: "#0088cc",
  danger: "#ff4757",
  warning: "#ffa502",
  success: "#2ed573",
  info: "#3498db",
  text: "#e4e6eb",
  muted: "#8b8fa3",
  border: "#2a2d3a",
  surface: "#1a1d27",
  bg: "#0f1117",
};

export const ACTIONS: ActionType[] = ["ALLOW", "FLAG", "BLOCK", "MONITOR"];

// Dark -> blue -> amber -> red ramp for the signal heatmap (intensity 0..1).
export function heatColor(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  const stops = [
    { p: 0, c: [20, 24, 34] },
    { p: 0.4, c: [52, 152, 219] },
    { p: 0.7, c: [255, 165, 2] },
    { p: 1, c: [255, 71, 87] },
  ];
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (x >= stops[i].p && x <= stops[i + 1].p) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi.p - lo.p || 1;
  const f = (x - lo.p) / span;
  const ch = (a: number, b: number) => Math.round(a + (b - a) * f);
  return `rgb(${ch(lo.c[0], hi.c[0])}, ${ch(lo.c[1], hi.c[1])}, ${ch(lo.c[2], hi.c[2])})`;
}

export function fmt(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

export function diffClass(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d.startsWith("e")) return "diff-easy";
  if (d.startsWith("m")) return "diff-medium";
  return "diff-hard";
}
