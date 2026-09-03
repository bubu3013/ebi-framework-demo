"use client"

import { useState } from "react"
import { PieChart } from "./pie-chart"

const SURVEY = "共同通信 第1回世論調査 (2026/1/24–25)"

// [E] fields are plain percentages (0-100) via slider.
// [B] fields are "people out of 10" counts — single questions map count×10 to a %,
// the party-support group gets normalized to 100 at submit time.
const PRESET = {
  q1_approve: 63, q7_ruling: 43, q7_balanced: 34, q8_approve: 44, q9_expect: 28,
  q10_issue: "Price measures", q11_stance: "Temp food cut",
  q2_ldp: 4, q2_cra: 1, q2_dpfp: 1, q2_ishin: 1, q2_sanseito: 1, q2_teammirai: 0, q2_other: 3,
  q4_interested: 8,
}

const Q10_OPTIONS: { label: string; pct: number }[] = [
  { label: "Price measures", pct: 59.3 },
  { label: "Social security", pct: 26.8 },
  { label: "Economy/employment", pct: 19.3 },
  { label: "Foreign policy/security", pct: 18.7 },
  { label: "Childcare/low birthrate", pct: 17.3 },
  { label: "Political funds scandal", pct: 10.3 },
]

const Q11_OPTIONS = ["No cut", "Temp food cut", "Perm food cut", "Broader cut", "Abolish"]

const MODELS = [
  { label: "GPT-4.1",    value: "gpt-4.1-2025-04-14" },
  { label: "Haiku 4.5",  value: "claude-haiku-4-5-20251001" },
  { label: "Sonnet 4.5", value: "claude-sonnet-4-5-20250929" },
]

const RESULT_PARTIES = [
  { key: "自民党",       color: "#0071e3" },
  { key: "中道改革連合", color: "#34c759" },
  { key: "国民民主党",   color: "#ff9500" },
  { key: "日本維新の会", color: "#af52de" },
  { key: "参政党",       color: "#ff3b30" },
  { key: "チームみらい", color: "#5ac8fa" },
  { key: "その他",       color: "#8e8e93" },
]

const ATTRIBUTION_LABELS: Record<string, string> = {
  q1: "🏛️ Cabinet approval",
  q7: "🎯 Preferred outcome",
  q8: "🗳️ Dissolution approval",
  q9: "🌱 New-party (CRA) expectation",
  q10: "📊 Top policy issue",
  q11: "💴 Consumption tax stance",
  q2: "🎌 Party support",
  q4: "🔥 Election interest",
}
const ATTRIBUTION_ORDER = ["q2", "q1", "q10", "q7", "q9", "q8", "q11", "q4"]

const DIRECTION_COLORS: Record<string, string> = { positive: "#27500A", negative: "#A32D2D", neutral: "#86868b" }
const DIRECTION_BG: Record<string, string> = { positive: "#EAF3DE", negative: "#FCEBEB", neutral: "#f5f5f7" }
const DIRECTION_ARROW: Record<string, string> = { positive: "▲", negative: "▼", neutral: "▬" }

interface Form {
  q1_approve: number; q7_ruling: number; q7_balanced: number
  q8_approve: number; q9_expect: number
  q10_issue: string; q11_stance: string
  q2_ldp: number; q2_cra: number; q2_dpfp: number; q2_ishin: number; q2_sanseito: number; q2_teammirai: number; q2_other: number
  q4_interested: number
}

interface Attribution { key: string; direction: string; reason: string }
interface ParsedResult { segments: { label: string; value: number; color: string }[]; attributions: Attribution[] }

function initForm(): Form {
  return { ...PRESET }
}

// Normalize a group of "people" counts to percentages summing to 100.
function normalize(counts: number[]): number[] {
  const sum = counts.reduce((a, b) => a + b, 0)
  if (sum === 0) return counts.map(() => 0)
  return counts.map(c => (c / sum) * 100)
}

function parseResult(raw: string): ParsedResult {
  const segments: { label: string; value: number; color: string }[] = []
  const lineRe = /^(.+?)=([\d.]+)\s*$/gm
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(raw)) !== null) {
    const party = RESULT_PARTIES.find(p => p.key === m![1].trim())
    if (party) segments.push({ label: party.key, value: parseFloat(m[2]), color: party.color })
  }

  const attributions: Attribution[] = []
  const attrRe = /^([a-z0-9]+)\s*:\s*(positive|negative|neutral)\s*[—-]\s*(.+)$/gim
  let am: RegExpExecArray | null
  while ((am = attrRe.exec(raw)) !== null) {
    attributions.push({ key: am[1].toLowerCase(), direction: am[2].toLowerCase(), reason: am[3].trim() })
  }
  return { segments, attributions }
}

const PERSON_EMOJI = ["👨", "👩", "👨", "👩", "👨", "👩", "👨", "👩", "👨", "👩"]

// Row of 10 person emoji (mixed genders) — click the nth person to set the count to n. Only used for [B].
function PeopleRow({ label, value, onChange, dotColor }: { label: string; value: number; onChange: (v: number) => void; dotColor?: string }) {
  return (
    <div className="ebi-row" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
      {dotColor && <div style={{ width: 9, height: 9, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />}
      <span className="ebi-row-label" style={{ fontSize: 14, color: "#6e6e73", fontWeight: 500, width: 160, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
        {PERSON_EMOJI.map((emoji, i) => (
          <span key={i} onClick={() => onChange(i + 1 === value ? i : i + 1)}
            style={{ fontSize: 15, lineHeight: 1, cursor: "pointer", opacity: i < value ? 1 : 0.2 }}>{emoji}</span>
        ))}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f", width: 34, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{value}/10</span>
    </div>
  )
}

// Percentage slider — used for [E]. Custom track/thumb CSS (not native accent-color) so the
// unfilled track never falls back to the browser's dark-mode black default.
function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="ebi-row" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, flexWrap: "wrap" }}>
      <span className="ebi-row-label" style={{ fontSize: 14, color: "#6e6e73", fontWeight: 500, width: 170, flexShrink: 0 }}>{label}</span>
      <input type="range" min={0} max={100} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="ejp-slider"
      />
      <span style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f", width: 34, textAlign: "right", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <style jsx>{`
        .ejp-slider {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: #e5e5ea;
          outline: none;
        }
        .ejp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0071e3;
          cursor: pointer;
          border: none;
        }
        .ejp-slider::-moz-range-track {
          height: 4px;
          border-radius: 2px;
          background: #e5e5ea;
        }
        .ejp-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #0071e3;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}

function Chips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {options.map(o => (
        <span key={o} onClick={() => onChange(o)} style={{
          padding: "3px 9px", borderRadius: 100, fontSize: 12, cursor: "pointer", userSelect: "none",
          border: value === o ? "1.5px solid #0071e3" : ".5px solid #e5e5ea",
          background: value === o ? "#E8F1FF" : "#f5f5f7",
          color: value === o ? "#003d8f" : "#86868b",
          fontWeight: value === o ? 600 : 400,
        }}>{o}</span>
      ))}
    </div>
  )
}

function GroupHint({ label }: { label: string }) {
  return <div style={{ fontSize: 12, color: "#c7c7cc", marginBottom: 7 }}>{label} — each row is independent; we normalize to 100% automatically.</div>
}

function ElectionForm({ form, onChange }: { form: Form; onChange: <K extends keyof Form>(key: K, val: Form[K]) => void }) {
  const q7Opposition = Math.max(0, 100 - form.q7_ruling - form.q7_balanced)

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#0071e3", marginBottom: 6 }}>
        Political context <span style={{ background: "#E8F1FF", color: "#003d8f", borderRadius: 4, padding: "1px 5px" }}>[E]</span>
      </div>
      <SliderRow label="🏛️ Cabinet approve %" value={form.q1_approve} onChange={v => onChange("q1_approve", v)} />
      <SliderRow label="🎯 Want ruling-bloc win %" value={form.q7_ruling} onChange={v => onChange("q7_ruling", v)} />
      <SliderRow label="🎯 Want balanced power %" value={form.q7_balanced} onChange={v => onChange("q7_balanced", v)} />
      <div style={{ fontSize: 12, color: "#c7c7cc", textAlign: "right", marginBottom: 7 }}>opposition win % ≈ {q7Opposition.toFixed(0)}</div>
      <SliderRow label="🗳️ Approve dissolution %" value={form.q8_approve} onChange={v => onChange("q8_approve", v)} />
      <SliderRow label="🌱 Expect new party (CRA) %" value={form.q9_expect} onChange={v => onChange("q9_expect", v)} />
      <div style={{ marginBottom: 7, marginTop: 4 }}>
        <div style={{ fontSize: 14, color: "#6e6e73", fontWeight: 500, marginBottom: 5 }}>📊 Top policy issue</div>
        <Chips options={Q10_OPTIONS.map(o => o.label)} value={form.q10_issue} onChange={v => onChange("q10_issue", v)} />
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, color: "#6e6e73", fontWeight: 500, marginBottom: 5 }}>💴 Consumption tax stance</div>
        <Chips options={Q11_OPTIONS} value={form.q11_stance} onChange={v => onChange("q11_stance", v)} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#639922", margin: "12px 0 6px" }}>
        Behavioral (poll) <span style={{ background: "#EAF3DE", color: "#173404", borderRadius: 4, padding: "1px 5px" }}>[B]</span>
      </div>
      <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 600, marginBottom: 4 }}>🎌 Party support</div>
      <GroupHint label="7 groups of 10 people" />
      {[
        { label: "自民 LDP",        key: "q2_ldp" as const,       color: RESULT_PARTIES[0].color },
        { label: "中道 CRA",        key: "q2_cra" as const,       color: RESULT_PARTIES[1].color },
        { label: "国民 DPFP",       key: "q2_dpfp" as const,      color: RESULT_PARTIES[2].color },
        { label: "維新 Ishin",      key: "q2_ishin" as const,     color: RESULT_PARTIES[3].color },
        { label: "参政 Sanseito",   key: "q2_sanseito" as const,  color: RESULT_PARTIES[4].color },
        { label: "みらい TeamMirai", key: "q2_teammirai" as const, color: RESULT_PARTIES[5].color },
        { label: "その他 / DK",     key: "q2_other" as const,     color: RESULT_PARTIES[6].color },
      ].map(({ label, key, color }) => (
        <PeopleRow key={key} label={label} value={form[key]} onChange={v => onChange(key, v)} dotColor={color} />
      ))}

      <PeopleRow label="🔥 Election interest" value={form.q4_interested} onChange={v => onChange("q4_interested", v)} />
    </div>
  )
}

function ResultPie({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <PieChart segments={segments} size={220} />
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

export function TryItYourselfElectionJp() {
  const [form, setForm] = useState<Form>(initForm)
  const [result, setResult] = useState<ParsedResult | null>(null)
  const [model,  setModel]  = useState(MODELS[2].value)
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function updateForm<K extends keyof Form>(key: K, val: Form[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function runPredict() {
    setLoading(true); setError(null)

    try {
      const q10 = Q10_OPTIONS.find(o => o.label === form.q10_issue) ?? Q10_OPTIONS[0]

      const q7Opposition = Math.max(0, 100 - form.q7_ruling - form.q7_balanced)
      const [q2Ldp, q2Cra, q2Dpfp, q2Ishin, q2Sanseito, q2Teammirai, q2Other] = normalize([
        form.q2_ldp, form.q2_cra, form.q2_dpfp, form.q2_ishin, form.q2_sanseito, form.q2_teammirai, form.q2_other,
      ])
      const q4Interested = form.q4_interested * 10

      const features = [{
        prediction_month: "2026-02",
        q1_approve: form.q1_approve.toFixed(1),
        q1_disapprove: (100 - form.q1_approve).toFixed(1),
        q7_ruling: form.q7_ruling.toFixed(1),
        q7_balanced: form.q7_balanced.toFixed(1),
        q7_opposition: q7Opposition.toFixed(1),
        q8_approve: form.q8_approve.toFixed(1),
        q8_disapprove: (100 - form.q8_approve).toFixed(1),
        q9_expect: form.q9_expect.toFixed(1),
        q9_not_expect: (100 - form.q9_expect).toFixed(1),
        q10_issue: q10.label,
        q10_pct: q10.pct.toFixed(1),
        q11_stance: form.q11_stance,
        q2_ldp: q2Ldp.toFixed(1),
        q2_cra: q2Cra.toFixed(1),
        q2_dpfp: q2Dpfp.toFixed(1),
        q2_ishin: q2Ishin.toFixed(1),
        q2_sanseito: q2Sanseito.toFixed(1),
        q2_teammirai: q2Teammirai.toFixed(1),
        q2_other: q2Other.toFixed(1),
        q4_interested: q4Interested.toFixed(1),
      }]
      const res = await fetch("/api/election-jp-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, model, apiKey: apiKey.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Request failed")
      setResult(parseResult(json.prediction.raw ?? ""))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.4rem 1.5rem" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em", marginBottom: 4 }}>
        Try your EBI
      </div>
      <div style={{ fontSize: 13, color: "#86868b", marginBottom: 16 }}>
        Adjust the {SURVEY} signals and see how EBI predicts each party&rsquo;s vote share for the 2026-02-08 election — and why.
      </div>

      <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Left 1/3: form */}
        <div style={{ minWidth: 0 }}>
          <ElectionForm form={form} onChange={updateForm} />

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

        {/* Right 2/3: result — each party's predicted vote share */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 12, paddingBottom: 6, borderBottom: ".5px solid #f0f0f5" }}>
            EBI Prediction — party vote share
          </div>
          {!result && (
            <div style={{ fontSize: 14, color: "#86868b", padding: "24px 0", textAlign: "center" }}>
              Adjust the signals on the left and click &ldquo;Run EBI&rdquo; to see the prediction and its reasoning.
            </div>
          )}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <ResultPie segments={result.segments} />
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
