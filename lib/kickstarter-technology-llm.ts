import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export interface KickstarterFeatures {
  prediction_month: string
  campaign_count: string
  median_goal_usd: string
  avg_campaign_duration: string
  sp500: string
  seasonal: string
  avg_early_backers: string
  pct_above_50pct: string
  pledged_ratio: string
}

const ATTRIBUTION_KEYS = [
  "campaign_count", "median_goal_usd", "avg_campaign_duration", "sp500", "seasonal",
  "avg_early_backers", "pct_above_50pct", "pledged_ratio",
] as const

const SYS = `You are a crowdfunding market analyst.
Based on the provided campaign environment data and early behavioral signals, predict the monthly campaign success rate for a specific Kickstarter category.

Output format — exactly two parts, nothing else (no extra text, headers, or bullet points):

Line 1: success_rate=0.XXX (value in range [0, 1], exactly 3 decimal places)

Then, one line per feature for the following 8 features, in this order: ${ATTRIBUTION_KEYS.join(", ")}
Format: <key>: <positive|negative|neutral> — <one sentence, under 20 words>

The one-sentence reason must be a concrete analytical judgment that references the actual value or comparison (e.g. how it compares to a typical range, or to the recent trend) — not a generic template like "value increased so effect is positive". Write as an analyst would justify the call to a colleague.`

function signedPct(val: string): string {
  const n = parseFloat(val)
  if (isNaN(n)) return val
  const pct = n * 100
  return pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`
}

function buildUserMsg(f: KickstarterFeatures): string {
  const goalNum = parseFloat(f.median_goal_usd)
  const goalStr = isNaN(goalNum) ? f.median_goal_usd : `$${goalNum.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD`
  const durNum = parseFloat(f.avg_campaign_duration)
  const durStr = isNaN(durNum) ? f.avg_campaign_duration : `${durNum.toFixed(1)} days`
  const backersNum = parseFloat(f.avg_early_backers)
  const backersStr = isNaN(backersNum) ? f.avg_early_backers : backersNum.toFixed(1)
  const pctNum = parseFloat(f.pct_above_50pct)
  const pctStr = isNaN(pctNum) ? f.pct_above_50pct : `${(pctNum * 100).toFixed(1)}%`
  const ratioNum = parseFloat(f.pledged_ratio)
  const ratioStr = isNaN(ratioNum) ? f.pledged_ratio : ratioNum.toFixed(4)

  return [
    "## Environmental Context [E]",
    `- Prediction month        : ${f.prediction_month}`,
    `- Category                : Technology`,
    `- Active campaign count   : ${f.campaign_count}`,
    `- Median funding goal     : ${goalStr}`,
    `- Average campaign duration: ${durStr}`,
    `- S&P 500 prev month rtn  : ${signedPct(f.sp500)}`,
    `- Seasonal context        : ${f.seasonal}`,
    "",
    "## Early Behavioral Signals [B]",
    `- Average backers in first 48h  : ${backersStr}`,
    `- % campaigns above 50% funded   : ${pctStr}`,
    `- Average early pledged ratio   : ${ratioStr}`,
    "",
    "## Prediction Task [I]",
    `Predict the success rate of Technology campaigns that launched in ${f.prediction_month}.`,
    "Success = campaign reaches or exceeds its stated funding goal by deadline.",
    "",
    "Output:",
    "Line 1 — success_rate=0.XXX",
    `Then one line each for: ${ATTRIBUTION_KEYS.join(", ")}`,
  ].join("\n")
}

export async function predictWithOpenAI(features: KickstarterFeatures, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey })
  const response = await client.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    temperature: 0,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: buildUserMsg(features) },
    ],
  })
  return response.choices[0]?.message?.content?.trim() ?? ""
}

export async function predictWithClaude(features: KickstarterFeatures, apiKey: string, model: string): Promise<string> {
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model,
    max_tokens: 500,
    temperature: 0,
    system: SYS,
    messages: [{ role: "user", content: buildUserMsg(features) }],
  })
  const block = response.content[0]
  return block.type === "text" ? block.text.trim() : ""
}
