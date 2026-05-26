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

  **Optimization Workflow:**
  ```text
  Step 1: Market generates observations (meverse env)
              ↓
  Step 2: Surveillance Agent (LLM, prompt_v_n)
          sees: burst_indicator, pattern_indicator, etc.
          decides: ALLOW / MONITOR / FLAG / BLOCK
              ↓
  Step 3: Action sent to env
          env updates state and computes per-step rewards
              ↓
  Step 4: After episode ends → Judge LLM sees:
          - Surveillance Agent's trajectory + its prompt
          - Per-step rewards
          - Final score breakdown (detection, false positives, etc.)
              ↓
          Judge outputs:
          - Improved Surveillance prompt_v_n+1
              ↓
  Step 5: Next episode runs with the improved prompt
  ```
- **Adaptive Difficulty:** Bots use stealth mechanics and adapt to your agent's success rate—if you miss an attack, the bots get bolder; if you block them, they back off.
- **Visual Dashboard:** Includes a Gradio-based interactive UI (`dashboard.py`) to run episodes, compare baselines, and review telemetry.

## Multi-Agent Architecture

TradeX doesn't just rely on procedural math; it runs a live orchestrator of distinct, interacting bots that blend their signals into the environment.

```text
  [ AgentPool ] Orchestrator
       │
       ├── [ ManipulatorBot ]   → Injects MEV attacks, evolves to hide (anti-hacking)
       ├── [ NormalTrader ]     → Generates organic baseline trades
       ├── [ LiquidityProvider] → "False Positive Trap" (High pattern, 0 manipulation)
       └── [ ArbitrageAgent ]   → Reacts to ManipulatorBot with large follow-up trades
       │
       ▼
  Generates Agent-Specific Signals (burst_boost, pattern_boost, manipulation_boost)
       │
       ▼
  [ AMM Environment ] (meverse/amm.py)
       ├── Procedural Generation (70% weight)
       └── AgentPool Signals (30% weight)
       │
       ▼
  Blended Observation (Price, Slippage, Time Gaps, Indicators)
       │
       ▼
  [ Surveillance Agent ]
```

## Avoiding Reward Hacking

TradeX implements several mechanisms to prevent the Surveillance Agent from "gaming" the reward function (e.g., just blocking every transaction to artificially inflate its detection score, or relying on a single simplistic metric).

1. **False Positive Traps (Liquidity Providers):** The Multi-Agent system includes a `LiquidityProvider` bot that generates highly patterned activity. If the Surveillance Agent relies purely on the `pattern_indicator` to issue a `BLOCK`, it will accidentally block the Liquidity Provider, triggering severe false-positive penalties.
2. **Adversarial Bot Evolution:** As episodes progress, the `ManipulatorBot` enters "Stage 3" (anti-hacking mode). It deliberately mimics normal trading time gaps (spacing trades > 1.0s) while still injecting malicious volume. This forces the agent to look beyond simple rapid-fire heuristics and analyze deeper price impacts.
3. **Balanced Reward Function:** The environment grades the agent using a strict weighted formula: 50% for Detection, but 20% penalty for False Positives, 15% penalty for False Negatives, 10% for Market Health, and 5% penalty for Overblocking. The LLM Prompt Optimizer is explicitly instructed about this balance to ensure it doesn't converge on a trigger-happy "BLOCK-all" strategy.

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
