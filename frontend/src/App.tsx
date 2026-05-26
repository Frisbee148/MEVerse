import { useEffect, useState } from "react";
import { getTasks } from "./lib/api";
import type { TaskInfo } from "./lib/api";
import AboutTab from "./components/AboutTab";
import EpisodeRunnerTab from "./components/EpisodeRunnerTab";
import PlaygroundTab from "./components/PlaygroundTab";
import PolicyComparisonTab from "./components/PolicyComparisonTab";
import TelemetryTab from "./components/TelemetryTab";

type TabId = "playground" | "episode" | "compare" | "telemetry" | "about";

const TABS: { id: TabId; label: string }[] = [
  { id: "playground", label: "Playground" },
  { id: "episode", label: "Episode Runner" },
  { id: "compare", label: "Policy Comparison" },
  { id: "telemetry", label: "Telemetry Viewer" },
  { id: "about", label: "About" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("playground");
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [tasksError, setTasksError] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((e) => setTasksError((e as Error).message));
  }, []);

  return (
    <>
      <header className="header">
        <h1>MEVerse Surveillance Dashboard</h1>
        <p>Bot-aware Market Surveillance in Simulated AMM Trading</p>
      </header>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tasksError && (
        <div className="page">
          <div className="error">Failed to load tasks: {tasksError}</div>
        </div>
      )}

      {tab === "playground" && <PlaygroundTab tasks={tasks} />}
      {tab === "episode" && <EpisodeRunnerTab tasks={tasks} />}
      {tab === "compare" && <PolicyComparisonTab tasks={tasks} />}
      {tab === "telemetry" && <TelemetryTab />}
      {tab === "about" && <AboutTab />}
    </>
  );
}
