import { ACTION_COLORS, C } from "../lib/colors";
import { Card } from "./ui";

const TASKS = [
  { title: "Burst Detection", diff: "Easy", steps: 50, desc: "Sudden high-frequency spikes." },
  { title: "Pattern Manipulation", diff: "Medium", steps: 50, desc: "Rhythmic coordination." },
  { title: "Full Market Surveillance", diff: "Hard", steps: 60, desc: "Both threats + noise." },
];

const ACTION_DESC: { action: keyof typeof ACTION_COLORS; desc: string }[] = [
  { action: "ALLOW", desc: "Normal activity, let it through." },
  { action: "MONITOR", desc: "Watch more closely." },
  { action: "FLAG", desc: "Mark as suspicious for review." },
  { action: "BLOCK", desc: "Block the activity." },
];

const AGENTS = [
  { name: "ManipulatorBot", desc: "Injects MEV attacks, evolves to hide." },
  { name: "NormalTrader", desc: "Organic baseline trades." },
  { name: "LiquidityProvider", desc: "False positive trap — looks patterned but benign." },
  { name: "ArbitrageAgent", desc: "Reacts to price deviations from manipulation." },
];

const SCORING = [
  { c: "Detection", w: "50%" },
  { c: "False Positive", w: "20%" },
  { c: "False Negative", w: "15%" },
  { c: "Health", w: "10%" },
  { c: "Overblocking", w: "5%" },
];

export default function AboutTab() {
  return (
    <div className="page">
      <Card>
        <div className="about-section">
          <h3>What is TradeX?</h3>
          <p>
            TradeX is a reinforcement-learning benchmark for <b>market surveillance</b>. It
            simulates an automated market maker (AMM) liquidity pool where bots and ordinary
            traders interact. A surveillance agent watches the order flow each step and decides
            whether to <b>ALLOW</b>, <b>MONITOR</b>, <b>FLAG</b>, or <b>BLOCK</b> the activity —
            catching manipulation while leaving honest trading untouched.
          </p>
        </div>

        <div className="about-section">
          <h3>Tasks</h3>
          <div className="about-grid">
            {TASKS.map((t) => (
              <div className="kv" key={t.title}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
                  {t.diff} · {t.steps} steps
                </div>
                <div style={{ color: C.muted }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section">
          <h3>Actions</h3>
          <div className="action-list">
            {ACTION_DESC.map(({ action, desc }) => (
              <div className="action-item" key={action}>
                <span className="action-badge" style={{ background: ACTION_COLORS[action] }}>
                  {action}
                </span>
                <span style={{ color: C.muted }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="about-section">
          <h3>Scoring</h3>
          <table style={{ maxWidth: 360 }}>
            <thead>
              <tr>
                <th>Component</th>
                <th className="num">Weight</th>
              </tr>
            </thead>
            <tbody>
              {SCORING.map((s) => (
                <tr key={s.c}>
                  <td>{s.c}</td>
                  <td className="num">{s.w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="about-section">
          <h3>How the Market Works</h3>
          <p>
            The pool follows a constant-product AMM rule (<b>x × y = k</b>): the price moves as
            reserves shift with each trade. The agent's actions create a feedback loop — blocking
            suspicious activity reduces the bot's confidence, while allowing it makes the bot
            bolder and more aggressive over time.
          </p>
        </div>

        <div className="about-section">
          <h3>Multi-Agent System</h3>
          <div className="about-grid">
            {AGENTS.map((a) => (
              <div className="kv" key={a.name}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: C.accent }}>{a.name}</div>
                <div style={{ color: C.muted }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
