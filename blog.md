# TradeX: Bot-Aware Market Surveillance in Simulated AMM Trading

## What is TradeX?
TradeX is an advanced reinforcement learning benchmark environment that simulates a constant product Automated Market Maker (AMM) pool (like Uniswap v2). It tasks an AI agent with acting as a **market surveillance controller**, analyzing real-time trading metrics to decide whether to `ALLOW`, `MONITOR`, `FLAG`, or `BLOCK` activity.

## The Problem
Decentralized Finance (DeFi) is heavily targeted by algorithmic MEV (Maximal Extractable Value) bots executing sandwich attacks, frontrunning, and JIT liquidity manipulation. TradeX provides a decision-intelligence sandbox to train AI agents to police these protocols, spotting complex manipulation patterns without penalizing organic traders.

## Why Use It?
* **AI Researchers:** Benchmark LLMs and RL agents on identical adversarial scenarios for MEV surveillance.
* **DeFi Security Engineers:** Target residual threat surfaces and achieve population-wide visibility over market activity.
* **Data Scientists:** Experiment with prompt optimization and generate labeled datasets of MEV attacks.

## Core Features
- **Multi-Agent Simulation Ecosystem:** A dynamic `AgentPool` where evolving `ManipulatorBots`, organic `NormalTraders`, reactive `ArbitrageAgents`, and `LiquidityProviders` (acting as false-positive traps) interact.
- **Iterative Prompt Optimizer:** A closed-loop "LLM-as-Judge" optimizer that refines the surveillance agent's system prompt based on trajectory feedback.
- **Adaptive Difficulty:** Bots use stealth mechanics and adapt to your agent's success rate.
- **Visual Dashboard:** An interactive React+Gradio UI to run episodes, compare baselines, and review telemetry.

## Quick Start
Run the official multi-task benchmark:
```bash
python inference.py
```

Launch the visual dashboard:
```bash
python dashboard.py
```

## Meverse Training Results

### Baseline vs Trained Performance
![Baseline vs Trained](meverse_plots/baseline_vs_trained.png)

### Reward vs Training Step
![Reward vs Training Step](meverse_plots/reward_vs_training_step.png)

### Task Scores Comparison
![Task Scores Comparison](meverse_plots/task_scores_comparison.png)
