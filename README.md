---
title: TradeX Surveillance Dashboard
emoji: "📊"
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# TradeX: Bot-Aware Market Surveillance in Simulated AMM Trading

## What is TradeX?
TradeX is an advanced reinforcement learning benchmark environment built on the [OpenEnv](https://github.com/openenv) framework. It simulates a constant product Automated Market Maker (AMM) pool (like Uniswap v2) and tasks an AI agent with acting as a **market surveillance controller**.

The agent monitors real-time trading metrics and decides whether to `ALLOW`, `MONITOR`, `FLAG`, or `BLOCK` activity, balancing the need to stop malicious bots while protecting normal, healthy market flow.

## What Problem is it Solving?
Decentralized Finance (DeFi) is constantly targeted by algorithmic MEV (Maximal Extractable Value) bots performing sandwich attacks, frontrunning, and JIT liquidity manipulation. 

TradeX provides an adversarial, decision-intelligence sandbox to evaluate and train AI agents to police these decentralized financial protocols. It challenges agents to spot complex market manipulation patterns without penalizing organic traders. 

## Who is this for?
- **AI Researchers:** To benchmark LLMs and Reinforcement Learning agents on complex, adversarial decision-making tasks.
- **DeFi Security Engineers:** To develop and test new detection heuristics for on-chain surveillance.
- **Data Scientists:** To experiment with prompt optimization and multi-agent interaction in simulated financial environments.

## Core Features
- **Multi-Agent Simulation Ecosystem:** TradeX features a dynamic `AgentPool` where evolving `ManipulatorBots`, organic `NormalTraders`, reactive `ArbitrageAgents`, and `LiquidityProviders` (acting as false-positive traps) interact and generate complex market signals.
- **Iterative Prompt Optimizer:** Includes a closed-loop "LLM-as-Judge" optimizer (`prompt_optimizer.py`) that iteratively refines the surveillance agent's system prompt based on trajectory feedback, automatically improving detection accuracy across different task difficulties.
- **Adaptive Difficulty:** Bots use stealth mechanics and adapt to your agent's success rate—if you miss an attack, the bots get bolder; if you block them, they back off.
- **Visual Dashboard:** Includes a Gradio-based interactive UI (`dashboard.py`) to run episodes, compare baselines, and review telemetry.

## Quick Start

Run the official multi-task benchmark (requires `API_BASE_URL`, `MODEL_NAME`, and `HF_TOKEN` environment variables):
```bash
python inference.py
```

Launch the visual dashboard for debugging and episode comparison:
```bash
pip install gradio plotly numpy
python dashboard.py
```

Run the Prompt Optimizer loop:
```bash
python prompt_optimizer.py --task full_market_surveillance --iterations 5 --seed 42
```

## Meverse Training Results

Below are the graphs and plots detailing the performance of the Meverse agent over the training period and comparing it against the baseline.

### Baseline vs Trained Performance
![Baseline vs Trained](meverse_plots/baseline_vs_trained.png)

### Reward vs Training Step
![Reward vs Training Step](meverse_plots/reward_vs_training_step.png)

### Task Scores Comparison
![Task Scores Comparison](meverse_plots/task_scores_comparison.png)
