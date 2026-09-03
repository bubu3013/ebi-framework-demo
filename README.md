# EBI Framework — Interactive Demo

Companion demo for the paper
**"Predicting Collective Behavior with Large Language Models: The EBI Framework for Response-Side Inference."**

Live demo: https://ai-army-emnlp-demo-2026.vercel.app

## Overview

Interactive demonstration of the **Exogenous–Behavioral–Inference (EBI)** framework for
population-level collective behavior prediction using LLMs, without relying on abundant
history-side data.

Two domains are included here:

| Domain | Country | Task |
|--------|---------|------|
| Japan 2026 Election | Japan | 7-party vote share prediction |
| Kickstarter Technology | United States | Monthly campaign success rate |

> The paper evaluates a third domain, Taiwan Health Supplements, which is based on
> proprietary retail sales data that cannot be publicly redistributed. It is therefore
> not included in this interactive demo. See the paper for its aggregate results.

## Features

- **Dashboard** — pre-computed results (JSD, Spearman ρ, MAE) vs. baselines (SARIMA, XGBoost, LSTM, LSTPrompt, RSS)
- **Ablation chart** — EBI context conditions: None → E only → B only → EB full
- **Upload & Predict** — live inference with your own API key; template CSV provided per domain

## Models

- `gpt-4.1-2025-04-14`
- `claude-haiku-4-5-20251001`
- `claude-sonnet-4-5-20250929`

## Running locally

```bash
npm install
npm run dev
```

The Dashboard and Ablation chart work out of the box using the pre-computed data in `public/data/`. Upload & Predict and Try It Yourself require your own OpenAI or Anthropic API key, entered directly in the UI — no server-side key is configured.

## License

MIT
