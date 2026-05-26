// Typed client for the MEVerse FastAPI backend.

export type ActionType = "ALLOW" | "FLAG" | "BLOCK" | "MONITOR";
export type Label = "normal" | "suspicious";

export interface TaskInfo {
  name: string;
  title: string;
  difficulty: string;
  numSteps: number;
  description: string;
}

export interface Grade {
  score: number;
  detection: number;
  falsePositive: number;
  falseNegative: number;
  health: number;
  overblocking: number;
}

export interface StepSignals {
  burst: number;
  pattern: number;
  suspicion: number;
  manipulation: number;
  frequency: number;
  slippage: number;
}

export interface StepRecord {
  step: number;
  block: number;
  action: ActionType;
  label: Label;
  reward: number;
  cumReward: number;
  activeAgents: string[];
  signals: StepSignals;
}

export interface AmmStates {
  steps: number[];
  price: number[];
  liquidity: number[];
  botConfidence: number[];
  volatility: number[];
  health: number[];
}

export interface SignalRow {
  name: string;
  values: number[];
}

export interface EpisodeSummary {
  task: string;
  taskTitle: string;
  difficulty: string;
  policy: string;
  seed: number;
  steps: number;
  totalReward: number;
  avgReward: number;
  finalAmm: { price: number; botConfidence: number; health: number; volatility: number };
}

export interface EpisodeResult {
  grade: Grade;
  stepHistory: StepRecord[];
  ammStates: AmmStates;
  signalMatrix: SignalRow[];
  episodeSummary: EpisodeSummary;
  stepRecords: StepRecord[];
}

export interface PolicyMetrics {
  score: number;
  detection: number;
  fp: number;
  fn: number;
  health: number;
  overblock: number;
  totalReward: number;
}

export interface CompareResult {
  results: Record<string, PolicyMetrics>;
  task: string;
  seed: number;
}

export interface Observation {
  currentAmmPrice: number;
  liquiditySnapshot: number;
  recentTradeCount: number;
  tradesInWindow: number[];
  tradeFrequency: number;
  averageTradeSize: number;
  maximumTradeSize: number;
  recentSlippageImpact: number;
  timeGapMean: number;
  timeGapMin: number;
  recentTimeGaps: number[];
  recentPriceImpacts: number[];
  suspiciousnessScore: number;
  manipulationScore: number;
  burstIndicator: number;
  patternIndicator: number;
  stepNum: number;
  maxSteps: number;
  taskName: string;
  scenarioNote: string;
  done: boolean;
  reward: number;
}

export interface TelemetryStep {
  step: number;
  action: ActionType;
  reward: number;
  label: Label;
}

export interface TelemetryResult {
  steps: TelemetryStep[];
  summary: {
    task: string | null;
    model: string | null;
    steps: number;
    totalReward: number;
    finalScore: number | null;
  };
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { detail?: string }).detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getTasks(): Promise<TaskInfo[]> {
  const res = await fetch("/api/tasks");
  if (!res.ok) throw new Error("Failed to load tasks");
  return res.json();
}

export const runEpisode = (task: string, policy: string, seed: number) =>
  post<EpisodeResult>("/api/run-episode", { task, policy, seed });

export const comparePolicies = (task: string, seed: number) =>
  post<CompareResult>("/api/compare-policies", { task, seed });

export const playgroundReset = (task: string, seed: number) =>
  post<{ observation: Observation; sessionId: string }>("/api/playground/reset", { task, seed });

export const playgroundStep = (sessionId: string, action: string) =>
  post<{ observation: Observation; reward: number; done: boolean }>("/api/playground/step", {
    sessionId,
    action,
  });

export const playgroundGrade = (sessionId: string) =>
  post<{ grade: Grade }>("/api/playground/grade", { sessionId });

export async function parseTelemetry(file: File): Promise<TelemetryResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/parse-telemetry", { method: "POST", body: fd });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { detail?: string }).detail || "Failed to parse telemetry");
  }
  return res.json();
}
