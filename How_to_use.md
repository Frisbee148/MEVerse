# How to Use MEVerse

Welcome to the comprehensive guide for running and interacting with the MEVerse market surveillance benchmark. This document covers the complete file structure, required API keys, how to run every component of the system, and how to read the logs.

---

## 1. Required API Keys and Environment Variables

MEVerse uses a language model as its primary surveillance agent and "judge" for prompt optimization. To run the LLM policies, you must provide your Hugging Face API credentials.

You can set these in your terminal or create a `.env` file in the root directory.

| Variable | Required | Default | Description |
|---|---|---|---|
| `HF_TOKEN` | **Yes** | — | Your Hugging Face API token. Without this, the system falls back to a hardcoded heuristic policy. |
| `API_BASE_URL` | No | `https://router.huggingface.co/v1` | OpenAI-compatible API endpoint. |
| `MODEL_NAME` | No | `Qwen/Qwen2.5-72B-Instruct` | The target model identifier for the LLM policy. |
| `MEVERSE_TASK` | No | `all` | When set, runs only the specified task (e.g., `burst_detection`). By default, all three tasks run sequentially. |
| `EVAL_MODE` | No | `true` | Runs the environment in fixed-seed deterministic mode for reproducible scores. |
| `DEMO_MODE` | No | `false` | Adds bounded variation to the simulation for local exploration. **Overrides EVAL_MODE.** |
| `DEBUG_TELEMETRY` | No | `false` | When set to `1`, writes step-by-step JSONL telemetry to the `telemetry/` folder. |

---

## 2. Complete Project Structure

Here is a breakdown of the entire MEVerse repository and where the core logic lives:

```text
MEVerse/
├── inference.py              # Competition entrypoint — LLM surveillance policy evaluator
├── dashboard.py              # Gradio UI — episode runner, comparison, telemetry viewer
├── app.py                    # OpenEnv server / HF Spaces entrypoint
├── compare_policies.py       # LLM vs heuristic benchmark analysis
├── prompt_optimizer.py       # Iterative LLM-as-judge loop to auto-tune the agent's prompt
├── openenv.yaml              # OpenEnv metadata and task definitions
├── Dockerfile                # Multi-stage Docker build
├── requirements.txt          # Python dependencies
├── meverse_plots/            # Saved training/performance visualizations
├── telemetry/                # Debug telemetry output directory (generated files go here)
├── docs/                     # Detailed UI documentation
│   ├── Dashboard.md          # Dashboard visualizations reference
│   └── playground.md         # Playground interface reference
├── tradex/                   # Multi-Agent Simulation Ecosystem
│   ├── agents.py             # Agent definitions (ManipulatorBot, NormalTrader, LiquidityProvider, ArbitrageAgent)
│   └── test_agents.py        # Test suite specifically for testing bot interactions
└── meverse/                  # Core Environment Package
    ├── __init__.py           
    ├── amm.py                # Constant-product AMM state machine + Multi-Agent signal blending
    ├── models.py             # Pydantic models (SurveillanceAction, SurveillanceObservation)
    ├── tasks.py              # Task definitions, step generation, and scoring logic
    ├── baseline_policy.py    # Threshold-based heuristic fallback policy
    ├── policy.py             # LLM policy config, client builder, action selection
    ├── client.py             # Environment client wrapper
    ├── env.py                # .env file loader
    ├── validation.py         # Score validation suite
    └── server/               # FastAPI OpenEnv server implementation
        └── meverse_environment.py
```

---

## 3. Runnable Files: What to Run and When

MEVerse includes multiple entrypoints depending on what you are trying to accomplish (evaluation, debugging, visualization, or optimization).

### A. Run the Official Benchmark (`inference.py`)
This is the main entrypoint. It runs all three tasks sequentially (`burst_detection`, `pattern_manipulation_detection`, `full_market_surveillance`) and calculates the agent's score.

```bash
# Run all three tasks in deterministic mode
python inference.py

# Run with step-by-step debug telemetry saved to disk
DEBUG_TELEMETRY=1 python inference.py
```

### B. Launch the Visual Dashboard (`dashboard.py` / `app.py`)
Use the interactive Gradio UI to run episodes step-by-step, compare the LLM against the heuristic baselines, and visually replay telemetry files.

```bash
# Install UI dependencies if needed
pip install gradio plotly numpy

# Launch the standalone dashboard locally
python dashboard.py
# Open http://127.0.0.1:7860

# Or launch the full OpenEnv app (which includes the dashboard)
python app.py
```

### C. Run the Prompt Optimizer (`prompt_optimizer.py`)
Run the closed-loop LLM-as-Judge to auto-improve the agent's surveillance prompt based on trajectory feedback.

```bash
# Optimize a specific task for 5 iterations
python prompt_optimizer.py --task burst_detection --iterations 5 --seed 42

# Run full Curriculum Mode (Optimizes easy task -> medium task -> hard task)
python prompt_optimizer.py --curriculum --iterations 5 --seed 42
```

### D. Verify the Multi-Agent System (`tradex/test_agents.py`)
Run the standalone test suite to verify that the `ManipulatorBot`, `LiquidityProvider`, and other agents are interacting correctly without needing to run a full LLM episode.

```bash
python tradex/test_agents.py
```

### E. Compare Policies Depth Analysis (`compare_policies.py`)
Runs the baseline heuristic against the LLM policy across all tasks to measure the performance delta.

```bash
python compare_policies.py
```

---

## 4. How the Log Files Look

When running `inference.py`, the system outputs clean, structured logs directly to `stdout`. These logs show exactly what the agent decided at every step and how it was rewarded.

A standard log sequence looks like this:

```text
[START] task=burst_detection env=amm-market-surveillance model=Qwen/Qwen2.5-72B-Instruct
[STEP] step=1 action=ALLOW reward=0.85 done=false error=null
[STEP] step=2 action=BLOCK reward=1.00 done=false error=null
[STEP] step=3 action=ALLOW reward=0.92 done=false error=null
...
[END] success=true steps=50 score=0.9997 rewards=0.85,1.00,0.92,...

[START] task=pattern_manipulation_detection env=amm-market-surveillance model=Qwen/Qwen2.5-72B-Instruct
...
[END] success=true steps=50 score=0.6041 rewards=...
```

### Debug Telemetry

If you run with `DEBUG_TELEMETRY=1`, the system creates a `.jsonl` file inside the `telemetry/` directory. These files are much richer than standard logs. They contain:
- The exact **observation JSON** seen by the LLM before it acted.
- Hidden labels (whether the step was actually an attack or organic).
- Internal AMM state shifts (bot confidence, volatility, etc.).

You can upload these `.jsonl` files directly into the **Telemetry Viewer** tab of the dashboard (`dashboard.py`) to replay and visually inspect the agent's performance.
