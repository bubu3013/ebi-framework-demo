"use client"

import { useState } from "react"

const MONTH = "Apr 2026"

// Real April 2026 values computed from Kickstarter_2026-03-12 snapshot
// (S_early for predicting April, same window logic as kickstarter_step2_eda_v2.py).
// No ground truth exists yet for April 2026 (S_final snapshot would need ~2026-06-12,
// latest available is 2026-05-12) — this is a teaching-only month, no GT/no comparison.
const PRESET = {
  campaign_count: 182, median_goal_usd: 9970.41, avg_campaign_duration: 39.15, sp500: -0.0509,
  seasonal: "Q2",
  avg_early_backers: 195.08, pct_above_50pct: 0.6813, pledged_ratio: 3.9076,
}

const SEASONAL_OPTIONS = ["Q1", "Q2", "Q3", "Q4"]
const MODELS = [
  { label: "GPT-4.1",    value: "gpt-4.1-2025-04-14" },
  { label: "Haiku 4.5",  value: "claude-haiku-4-5-20251001" },
  { label: "Sonnet 4.5", value: "claude-sonnet-4-5-20250929" },
]

const ATTRIBUTION_LABELS: Record<string, string> = {
  campaign_count: "📦 Other campaigns launching this month",
  median_goal_usd: "💰 Typical funding goal (market)",
  avg_campaign_duration: "📅 Typical campaign length",
  sp500: "📈 Stock market trend",
  seasonal: "🗓️ Season",
  avg_early_backers: "🤝 Backers other campaigns got early",
  pct_above_50pct: "📊 % of campaigns already half-funded",
  pledged_ratio: "💵 Avg. pledged vs. goal (others)",
}
const ATTRIBUTION_ORDER = [
  "campaign_count", "median_goal_usd", "avg_campaign_duration", "sp500", "seasonal",
  "avg_early_backers", "pct_above_50pct", "pledged_ratio",
]

const DIRECTION_COLORS: Record<string, string> = {
  positive: "#27500A",
  negative: "#A32D2D",
  neutral: "#86868b",
}
const DIRECTION_BG: Record<string, string> = {
  positive: "#EAF3DE",
  negative: "#FCEBEB",
  neutral: "#f5f5f7",
}
const DIRECTION_ARROW: Record<string, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "▬",
}

interface MonthForm {
  campaignCount: number; medianGoalUsd: number; avgCampaignDuration: number; sp500: number
  seasonal: string
  avgEarlyBackers: number; pctAbove50pct: number; pledgedRatio: number
}

interface Attribution {
  key: string
  direction: string
  reason: string
}

interface ParsedResult {
  successRate: number
  attributions: Attribution[]
}

function initForm(): MonthForm {
  return {
    campaignCount: PRESET.campaign_count, medianGoalUsd: PRESET.median_goal_usd, avgCampaignDuration: PRESET.avg_campaign_duration,
    sp500: PRESET.sp500, seasonal: PRESET.seasonal,
    avgEarlyBackers: PRESET.avg_early_backers, pctAbove50pct: PRESET.pct_above_50pct, pledgedRatio: PRESET.pledged_ratio,
  }
}

function parseResult(raw: string): ParsedResult | null {
  const m = raw.match(/success_rate\s*=\s*([\d.]+)/i)
  if (!m) return null
  const successRate = parseFloat(m[1])

  const attributions: Attribution[] = []
  const lineRe = /^([a-z_0-9]+)\s*:\s*(positive|negative|neutral)\s*[—-]\s*(.+)$/gim
  let lm: RegExpExecArray | null
  while ((lm = lineRe.exec(raw)) !== null) {
    attributions.push({ key: lm[1], direction: lm[2].toLowerCase(), reason: lm[3].trim() })
  }
  return { successRate, attributions }
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {options.map(o => (
        <span key={o} onClick={() => onChange(o)} style={{
          padding: "3px 9px", borderRadius: 100, fontSize: 13, cursor: "pointer", userSelect: "none",
          border: value === o ? "1.5px solid #0071e3" : ".5px solid #e5e5ea",
          background: value === o ? "#E8F1FF" : "#f5f5f7",
          color: value === o ? "#003d8f" : "#86868b",
          fontWeight: value === o ? 600 : 400,
        }}>{o}</span>
      ))}
    </div>
  )
}

function SliderRow({ value, min, max, step, onChange, fmt }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: 90, accentColor: "#0071e3" }} />
      <span style={{ fontSize: 12, color: "#1d1d1f", fontWeight: 600, minWidth: 48, textAlign: "right" }}>{fmt(value)}</span>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 7 }}>
      <span style={{ fontSize: 15, color: "#6e6e73", fontWeight: 500 }}>{label}</span>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function MonthColumn({ form, onChange }: {
  form: MonthForm
  onChange: <K extends keyof MonthForm>(key: K, val: MonthForm[K]) => void
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* [E] */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#0071e3", marginBottom: 6 }}>
        Exogenous <span style={{ background: "#E8F1FF", color: "#003d8f", borderRadius: 4, padding: "1px 5px" }}>[E]</span>
      </div>
      <FormRow label="📦 Other campaigns launching this month">
        <SliderRow value={form.campaignCount} min={0} max={400} step={1} onChange={v => onChange("campaignCount", v)} fmt={v => v.toFixed(0)} />
      </FormRow>
      <FormRow label="💰 Typical funding goal (market)">
        <SliderRow value={form.medianGoalUsd} min={500} max={20000} step={100} onChange={v => onChange("medianGoalUsd", v)} fmt={v => `$${v.toFixed(0)}`} />
      </FormRow>
      <FormRow label="📅 Typical campaign length">
        <SliderRow value={form.avgCampaignDuration} min={10} max={60} step={0.5} onChange={v => onChange("avgCampaignDuration", v)} fmt={v => `${v.toFixed(1)}d`} />
      </FormRow>
      <FormRow label="📈 Stock market trend">
        <SliderRow value={form.sp500} min={-0.05} max={0.05} step={0.001} onChange={v => onChange("sp500", v)} fmt={v => `${(v * 100).toFixed(1)}%`} />
      </FormRow>
      <FormRow label="🗓️ Season">
        <Chips options={SEASONAL_OPTIONS} value={form.seasonal} onChange={v => onChange("seasonal", v)} />
      </FormRow>

      {/* [B] */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#639922", margin: "8px 0 6px" }}>
        Behavioral <span style={{ background: "#EAF3DE", color: "#173404", borderRadius: 4, padding: "1px 5px" }}>[B]</span>
      </div>
      <FormRow label="🤝 Backers other campaigns got early">
        <SliderRow value={form.avgEarlyBackers} min={0} max={400} step={1} onChange={v => onChange("avgEarlyBackers", v)} fmt={v => v.toFixed(0)} />
      </FormRow>
      <FormRow label="📊 % of campaigns already half-funded">
        <SliderRow value={form.pctAbove50pct} min={0} max={1} step={0.01} onChange={v => onChange("pctAbove50pct", v)} fmt={v => `${(v * 100).toFixed(0)}%`} />
      </FormRow>
      <FormRow label="💵 Avg. pledged vs. goal (others)">
        <SliderRow value={form.pledgedRatio} min={0} max={6} step={0.05} onChange={v => onChange("pledgedRatio", v)} fmt={v => v.toFixed(2)} />
      </FormRow>
    </div>
  )
}

function SuccessGauge({ rate }: { rate: number }) {
  const size = 220
  const cx = 50, cy = 50, r = 42
  const pct = Math.max(0, Math.min(1, rate)) * 100
  const circumference = 2 * Math.PI * r
  const dash = (pct / 100) * circumference
  const color = pct >= 70 ? "#27500A" : pct >= 40 ? "#BA7517" : "#A32D2D"

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f5f5f7" strokeWidth={10} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
            strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>
            {pct.toFixed(0)}%
          </div>
          <div style={{ fontSize: 12, color: "#86868b", fontWeight: 500, marginTop: 2 }}>
            Predicted Success Rate
          </div>
        </div>
      </div>
    </div>
  )
}

function AttributionChips({ attributions }: { attributions: Attribution[] }) {
  const byKey = new Map(attributions.map(a => [a.key, a]))
  const ordered = ATTRIBUTION_ORDER
    .map(key => byKey.get(key))
    .filter((a): a is Attribution => !!a)
    .sort((a, b) => Number(a.direction === "neutral") - Number(b.direction === "neutral"))
  const keyDriverCount = Math.min(2, ordered.filter(a => a.direction !== "neutral").length)

  const [hovered, setHovered] = useState<string | null>(ordered.length > 0 ? ordered[0].key : null)
  const active = ordered.find(a => a.key === hovered) ?? null
  const activeIdx = active ? ordered.findIndex(a => a.key === active.key) : -1

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {ordered.map((a, i) => (
          <div key={a.key}
            onMouseEnter={() => setHovered(a.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", cursor: "default",
              borderRadius: 100, background: DIRECTION_BG[a.direction] ?? "#f5f5f7",
              border: hovered === a.key ? `1.5px solid ${DIRECTION_COLORS[a.direction] ?? "#86868b"}` : "1.5px solid transparent",
              transition: "border-color .15s",
            }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: DIRECTION_COLORS[a.direction] ?? "#86868b" }}>
              {DIRECTION_ARROW[a.direction] ?? "•"}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f", whiteSpace: "nowrap" }}>{ATTRIBUTION_LABELS[a.key] ?? a.key}</span>
            {i < keyDriverCount && (
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#0071e3", background: "#E8F1FF", borderRadius: 4, padding: "1px 5px" }}>
                Key
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, padding: "12px 14px", borderRadius: 10, minHeight: 52,
        background: active ? (DIRECTION_BG[active.direction] ?? "#f5f5f7") : "#f5f5f7",
      }}>
        {active ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            {activeIdx < keyDriverCount && (
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "#0071e3", background: "#E8F1FF", borderRadius: 4, padding: "2px 5px", flexShrink: 0, marginTop: 2 }}>
                Key driver
              </span>
            )}
            <p style={{ fontSize: 14, color: "#4b5563", margin: 0, lineHeight: 1.5 }}>{active.reason}</p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "#c7c7cc", margin: 0 }}>Hover a feature to see why.</p>
        )}
      </div>
    </div>
  )
}

export function TryItYourselfKickstarter() {
  const [form, setForm] = useState<MonthForm>(initForm)
  const [result, setResult] = useState<ParsedResult | null>(null)
  const [model,  setModel]  = useState(MODELS[2].value)
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function updateForm<K extends keyof MonthForm>(key: K, val: MonthForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function runPredict() {
    setLoading(true); setError(null)

    try {
      const features = [{
        prediction_month: "2026-04",
        campaign_count: String(form.campaignCount),
        median_goal_usd: String(form.medianGoalUsd),
        avg_campaign_duration: String(form.avgCampaignDuration),
        sp500: String(form.sp500),
        seasonal: form.seasonal,
        avg_early_backers: String(form.avgEarlyBackers),
        pct_above_50pct: String(form.pctAbove50pct),
        pledged_ratio: String(form.pledgedRatio),
      }]
      const res = await fetch("/api/kickstarter-technology-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, model, apiKey: apiKey.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Request failed")
      const parsed = parseResult(json.prediction.raw ?? "")
      if (!parsed) throw new Error("Could not parse model response")
      setResult(parsed)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.4rem 1.5rem" }}>
      {/* Header */}
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em", marginBottom: 4 }}>
        Try your EBI
      </div>
      <div style={{ fontSize: 13, color: "#86868b", marginBottom: 16 }}>
        You&rsquo;re about to launch a Technology campaign in {MONTH}. Adjust the market conditions around you and see how EBI predicts your category&rsquo;s success rate — and why.
      </div>

      {/* Left 1/3 form, right 2/3 result */}
      <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Left column */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 12, paddingBottom: 6, borderBottom: ".5px solid #f0f0f5" }}>
            {MONTH}
          </div>
          <MonthColumn form={form} onChange={updateForm} />

          {/* Controls */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: ".5px solid #e5e5ea", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#86868b", marginBottom: 6 }}>Model</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {MODELS.map(m => (
                  <div key={m.value} onClick={() => setModel(m.value)} style={{
                    fontSize: 13, padding: "4px 10px", borderRadius: 100, cursor: "pointer",
                    border: model === m.value ? "1.5px solid #0071e3" : ".5px solid #e5e5ea",
                    background: model === m.value ? "#E8F1FF" : "#f5f5f7",
                    color: model === m.value ? "#003d8f" : "#86868b",
                    fontWeight: model === m.value ? 600 : 400, userSelect: "none",
                  }}>{m.label}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#86868b", marginBottom: 6 }}>API Key (Required)</div>
              <input type="password" placeholder="sk-..."
                value={apiKey} onChange={e => setApiKey(e.target.value)}
                style={{ width: "100%", fontSize: 14, padding: "7px 10px", borderRadius: 8, border: ".5px solid #e5e5ea", background: "#f5f5f7", color: "#1d1d1f", boxSizing: "border-box" }}
              />
              <div style={{ fontSize: 12, color: "#c7c7cc", marginTop: 3 }}>Sent directly to the model. Never stored.</div>
            </div>
            <button onClick={runPredict} disabled={loading} style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: !loading ? "#0071e3" : "#e5e5ea",
              color: !loading ? "#fff" : "#86868b",
              fontSize: 15, fontWeight: 600,
              cursor: !loading ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
            }}>
              {loading ? "Running…" : "Run EBI →"}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "#FCEBEB", border: ".5px solid #E24B4A", fontSize: 13, color: "#A32D2D" }}>
              {error}
            </div>
          )}
        </div>

        {/* Right column: result */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 12, paddingBottom: 6, borderBottom: ".5px solid #f0f0f5" }}>
            EBI Prediction
          </div>
          {!result && (
            <div style={{ fontSize: 14, color: "#86868b", padding: "24px 0", textAlign: "center" }}>
              Adjust the signals on the left and click &ldquo;Run EBI&rdquo; to see the prediction and its reasoning.
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <SuccessGauge rate={result.successRate} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#86868b", marginBottom: 8 }}>
                  Why EBI predicted this
                </div>
                <AttributionChips attributions={result.attributions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
