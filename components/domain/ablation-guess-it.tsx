"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { PieChart } from "./pie-chart"

const CONFETTI_COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#ffd60a","#ff6b9d","#00c9a7"]
const BAR_COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#5ac8fa","#8e8e93"]

function FullPageConfetti({ trigger }: { trigger: number }) {
  const [active, setActive] = useState(false)
  const [particles] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      dx: (Math.random() - 0.5) * 200,
      dy: 200 + Math.random() * 400,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      round: Math.random() > 0.5,
      delay: Math.random() * 0.6,
      spin: (Math.random() - 0.5) * 720,
    }))
  )

  useEffect(() => {
    if (trigger === 0) return
    setActive(true)
    const t = setTimeout(() => setActive(false), 5500)
    return () => clearTimeout(t)
  }, [trigger])

  if (!active) return null

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      <style>{`
        @keyframes cf {
          0%   { transform: translate(0,0) rotate(0deg); opacity:1; }
          80%  { opacity:1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--spin)); opacity:0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: "-10px",
          width: p.w, height: p.h,
          borderRadius: p.round ? "50%" : 2,
          background: p.color,
          animation: `cf 5s cubic-bezier(.25,.46,.45,.94) ${p.delay}s both`,
          // @ts-ignore
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`, "--spin": `${p.spin}deg`,
        }} />
      ))}
    </div>
  )
}

interface FeatureEntry {
  label: string
  tag: string
  insight: string
  jsd: number | null
  delta_jsd: number | null
  rho: number
  mae: number
  pred: number[]
  monthly?: Record<string, string | number>
}

interface GuessItProps {
  parties: string[]
  fullEbi?: { jsd: number; rho: number; mae: number; pred: number[] }
  features: FeatureEntry[]
  chartType?: "donut" | "line"
  fullEbiMonthly?: Record<string, string | number>
  gtMonthly?: Record<string, string | number>
  months?: string[]
  valueMode?: "band" | "percent"
  yDomain?: [number, number]
}

const HS_MONTHS = ["Aug 2025", "Sep 2025", "Oct 2025"]
const HS_BAND_Y: Record<string, number> = { High: 0.165, Mid: 0.5, Low: 0.835 }
const HS_BANDS = [
  { label: "High", y0: 0,    y1: 0.33, color: "#F0FDF4", text: "#27500A" },
  { label: "Mid",  y0: 0.33, y1: 0.67, color: "#FEFCE8", text: "#854F0B" },
  { label: "Low",  y0: 0.67, y1: 1.0,  color: "#FFF0EE", text: "#A32D2D" },
]

function fmtVal(v: string | number, valueMode: "band" | "percent"): string {
  if (valueMode === "percent" && typeof v === "number") return `${(v * 100).toFixed(1)}%`
  return String(v)
}

// SVG layout — identical constants to pred-gt-chart
const LG_VB_W = 600, LG_VB_H = 210
const LG_L = 52, LG_R = 20, LG_TOP = 10, LG_BOT = 26
const LG_cW = LG_VB_W - LG_L - LG_R
const LG_cH = LG_VB_H - LG_TOP - LG_BOT
const LG_INNER = 20

function lgXof(i: number, n: number) { return LG_L + LG_INNER + (i / (n - 1)) * (LG_cW - LG_INNER * 2) }
function lgYof(v: string | number, valueMode: "band" | "percent", yDomain: [number, number]) {
  if (valueMode === "percent") {
    const [lo, hi] = yDomain
    const num = typeof v === "number" ? v : (lo + hi) / 2
    return LG_TOP + (1 - (num - lo) / (hi - lo)) * LG_cH
  }
  return LG_TOP + (HS_BAND_Y[v as string] ?? 0.5) * LG_cH
}

interface SvgLine { monthly: Record<string, string | number>; stroke: string; dash: string; dotR: number; dotFill: string; legendLabel: string }

function GuessItSvgChart({ lines, hoveredIdx, onHover, months, valueMode, yDomain }: {
  lines: SvgLine[]; hoveredIdx: number | null; onHover: (i: number | null) => void
  months: string[]; valueMode: "band" | "percent"; yDomain: [number, number]
}) {
  const zoneW = LG_cW / months.length
  return (
    <svg viewBox={`0 0 ${LG_VB_W} ${LG_VB_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      {valueMode === "band" ? (
        <>
          {HS_BANDS.map(b => (
            <rect key={b.label} x={LG_L} y={LG_TOP + b.y0 * LG_cH} width={LG_cW} height={(b.y1 - b.y0) * LG_cH} fill={b.color} />
          ))}
          {[0.33, 0.67].map(y => (
            <line key={y} x1={LG_L} y1={LG_TOP + y * LG_cH} x2={LG_L + LG_cW} y2={LG_TOP + y * LG_cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
          ))}
          {HS_BANDS.map(b => (
            <text key={b.label} x={LG_L - 6} y={LG_TOP + (b.y0 + (b.y1 - b.y0) / 2) * LG_cH + 4}
              textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill={b.text} fontWeight={600}>{b.label}</text>
          ))}
        </>
      ) : (
        <>
          {[0, 0.5, 1].map(f => (
            <line key={f} x1={LG_L} y1={LG_TOP + f * LG_cH} x2={LG_L + LG_cW} y2={LG_TOP + f * LG_cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
          ))}
          {[0, 0.5, 1].map(f => (
            <text key={f} x={LG_L - 6} y={LG_TOP + f * LG_cH + 4}
              textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill="#86868b" fontWeight={600}>
              {`${((yDomain[1] - f * (yDomain[1] - yDomain[0])) * 100).toFixed(0)}%`}
            </text>
          ))}
        </>
      )}
      {lines.map((line, li) => {
        const pts = months.map((m, i) => ({ x: lgXof(i, months.length), y: lgYof(line.monthly[m] ?? "Mid", valueMode, yDomain) }))
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
        return (
          <g key={li}>
            <path d={d} fill="none" stroke={line.stroke} strokeWidth={2.5} strokeDasharray={line.dash} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={hoveredIdx === i ? line.dotR + 2 : line.dotR} fill={line.dotFill} stroke="#fff" strokeWidth={1.5} style={{ transition: "r .1s" }} />
            ))}
          </g>
        )
      })}
      {months.map((m, i) => (
        <text key={m} x={lgXof(i, months.length)} y={LG_VB_H - 6}
          textAnchor="middle" fontSize={months.length > 6 ? 9 : 11} fontFamily="-apple-system,sans-serif"
          fill={hoveredIdx === i ? "#1d1d1f" : "#86868b"} fontWeight={hoveredIdx === i ? 700 : 400}>
          {months.length > 6 ? m.replace(" 20", " '") : m}
        </text>
      ))}
      {/* Hover highlight column */}
      {hoveredIdx !== null && (
        <rect x={LG_L + hoveredIdx * zoneW} y={LG_TOP} width={zoneW} height={LG_cH}
          fill="rgba(0,0,0,0.04)" rx={4} pointerEvents="none" />
      )}
      {/* Hit zones */}
      {months.map((_, i) => (
        <rect key={i} x={LG_L + i * zoneW} y={0} width={zoneW} height={LG_VB_H}
          fill="transparent" style={{ cursor: "pointer" }}
          onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} />
      ))}
    </svg>
  )
}

const BAND_COLOR: Record<string, string> = { High: "#27500A", Mid: "#854F0B", Low: "#A32D2D" }
const BAND_BG: Record<string, string> = { High: "#EAF3DE", Mid: "#FEFCE8", Low: "#FFF0EE" }

function LineGuessIt({ features, fullEbiMonthly, gtMonthly, months, valueMode, yDomain }: {
  features: FeatureEntry[]
  fullEbiMonthly: Record<string, string | number>
  gtMonthly: Record<string, string | number>
  months: string[]
  valueMode: "band" | "percent"
  yDomain: [number, number]
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [firstReveal, setFirstReveal] = useState<Set<number>>(new Set())
  const [correct, setCorrect] = useState(0)
  const [guessed, setGuessed] = useState(0)
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const ranked = useMemo(() => [...features]
    .map((f, i) => ({
      i,
      delta: f.delta_jsd ?? 0,
    }))
    .sort((a, b) => b.delta - a.delta), [features])

  function rankOf(idx: number) { return ranked.findIndex(r => r.i === idx) + 1 }
  function pick(idx: number) {
    const rank = rankOf(idx)
    setSelected(idx)
    if (!firstReveal.has(idx)) {
      const newSet = new Set(firstReveal).add(idx)
      setFirstReveal(newSet)
      setGuessed(g => g + 1)
      if (rank === 1) { setCorrect(c => c + 1); setConfettiTrigger(t => t + 1) }
    } else if (rank === 1) {
      setConfettiTrigger(t => t + 1)
    }
  }

  const f = selected !== null ? features[selected] : null
  const woMonthly: Record<string, string | number> = f?.monthly ?? {}
  const delta = f ? (f.delta_jsd ?? 0) : 0
  const rank = selected !== null ? rankOf(selected) : 0
  const worse = delta > 0

  const svgLines: SvgLine[] = [
    { monthly: fullEbiMonthly, stroke: "#1a6bbf", dash: "", dotR: 5.5, dotFill: "#1a6bbf", legendLabel: "Full EBI" },
    ...(f ? [{ monthly: woMonthly, stroke: "#E24B4A", dash: "6,4", dotR: 5, dotFill: "#E24B4A", legendLabel: `Without [${f.tag}]` }] : []),
    { monthly: gtMonthly, stroke: "#c07c1a", dash: "5,3", dotR: 5, dotFill: "#c07c1a", legendLabel: "Ground truth" },
  ]

  // Side panel content
  const hoveredMonth = hoveredIdx !== null ? months[hoveredIdx] : null
  function SidePanel() {
    if (!hoveredMonth) {
      return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 4, padding: "0 8px" }}>
          <span style={{ fontSize: 18 }}>👆</span>
          <span style={{ fontSize: 11, color: "#c7c7cc", textAlign: "center", lineHeight: 1.4 }}>Hover a month</span>
        </div>
      )
    }
    const rows = [
      { label: "Full EBI", color: "#1a6bbf", val: fullEbiMonthly[hoveredMonth] ?? "—" },
      ...(f ? [{ label: `Without [${f.tag}]`, color: "#E24B4A", val: woMonthly[hoveredMonth] ?? "—" }] : []),
      { label: "Ground truth", color: "#c07c1a", val: gtMonthly[hoveredMonth] ?? "—" },
    ]
    return (
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1d1d1f", marginBottom: 2 }}>{hoveredMonth}</div>
        {rows.map(r => {
          const bandBg = valueMode === "band" ? (BAND_BG[r.val as string] ?? "#f5f5f7") : "#f5f5f7"
          const bandC = valueMode === "band" ? (BAND_COLOR[r.val as string] ?? "#4b5563") : "#1d1d1f"
          return (
            <div key={r.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 10, color: r.color, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: bandC, background: bandBg, borderRadius: 6, padding: "2px 6px", display: "inline-block" }}>{fmtVal(r.val, valueMode)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.25rem 1.4rem", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <FullPageConfetti trigger={confettiTrigger} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Guess It</span>
          <span style={{ fontSize: 14, color: "#86868b", marginLeft: 8 }}>which feature matters most?</span>
        </div>
        {guessed > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#86868b" }}>
            {correct}/{guessed} top pick
          </span>
        )}
      </div>
      <p style={{ fontSize: 15, color: "#86868b", marginBottom: 14 }}>
        {selected === null
          ? "Tap a feature. What happens when it's removed?"
          : rank === 1 ? "Correct — that's the most impactful. Try another?"
          : `Rank #${rank} of ${features.length}. Can you find #1?`}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {features.map((feat, i) => {
          const isE = feat.tag === "E"
          const isSelected = selected === i
          const isRevealed = firstReveal.has(i)
          const isDimmed = isRevealed && !isSelected
          const base = isE ? { bg: "#E8F1FF", border: "#0071e3", color: "#003d8f" } : { bg: "#EAF3DE", border: "#639922", color: "#173404" }
          const active = isE ? { bg: "#0071e3", border: "#005bb5", color: "#fff" } : { bg: "#3B6D11", border: "#27500A", color: "#fff" }
          const style = isSelected ? active : base
          return (
            <span key={i} onClick={() => pick(i)} style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 100,
              border: `1.5px solid ${style.border}`, background: style.bg, color: style.color,
              fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: isDimmed ? 0.4 : 1,
              transition: "opacity .15s", userSelect: "none", whiteSpace: "nowrap",
            }}>
              [{feat.tag}] {feat.label}
            </span>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 11, color: "#86868b" }}>
        {svgLines.map((line, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="24" height="10">
              <line x1="0" y1="5" x2="24" y2="5" stroke={line.stroke} strokeWidth="2.5" strokeDasharray={line.dash || undefined}/>
              <circle cx="12" cy="5" r="3.5" fill={line.dotFill}/>
            </svg>
            {line.legendLabel}
          </div>
        ))}
      </div>

      {/* Chart 75% + side panel 25% */}
      <div className="ebi-panel-split" style={{ display: "grid", gridTemplateColumns: "75% 25%", border: ".5px solid #e5e5ea", borderRadius: 12, overflow: "hidden", height: 230, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0 4px", height: "100%", boxSizing: "border-box" }}>
          <GuessItSvgChart lines={svgLines} hoveredIdx={hoveredIdx} onHover={setHoveredIdx} months={months} valueMode={valueMode} yDomain={yDomain} />
        </div>
        <div style={{ borderLeft: ".5px solid #e5e5ea", background: "#fff" }}>
          <SidePanel />
        </div>
      </div>

      {f && (() => {
        const rankLabel = rank === 1 ? "Most critical" : rank === features.length ? "Least critical" : `#${rank} of ${features.length}`
        const bg = !worse ? "#EAF3DE" : rank <= 2 ? "#FCEBEB" : "#F5F5F7"
        const textC = !worse ? "#27500A" : rank <= 2 ? "#A32D2D" : "#4b5563"
        const badgeBg = !worse ? "#639922" : rank <= 2 ? "#E24B4A" : "#888780"
        // per-month comparison: Full EBI vs Without [feature]
        const monthChips = months.map(m => {
          const full = fullEbiMonthly[m]
          const wo   = woMonthly[m] ?? full
          const changed = wo !== full
          return { m, full, wo, changed }
        })
        const anyChanged = monthChips.some(c => c.changed)
        return (
          <div style={{ borderRadius: 10, background: bg, padding: "1rem 1.1rem" }}>
            <style>{`
              @keyframes pop-delta { 0% { transform: scale(0.6); opacity: 0 } 60% { transform: scale(1.08) } 100% { transform: scale(1); opacity: 1 } }
            `}</style>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 100, background: badgeBg, color: "#fff" }}>{rankLabel}</span>
              {rank === 1 && <span style={{ fontSize: 16, fontWeight: 700, color: "#27500A" }}>Great pick!</span>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span key={`${f.label}-delta`} style={{ fontSize: 28, fontWeight: 500, color: textC, animation: "pop-delta .35s cubic-bezier(.34,1.56,.64,1) both" }}>
                {worse ? "+" : delta === 0 ? "±" : ""}{delta.toFixed(valueMode === "percent" ? 4 : 3)}
              </span>
              <span style={{ fontSize: 14, color: "#86868b" }}>ΔJSD vs Full EBI</span>
            </div>

            {/* Per-month comparison chips */}
            <div style={{ display: "flex", gap: months.length > 6 ? 3 : 6, marginBottom: 10 }}>
              {monthChips.map(({ m, full, wo, changed }) => {
                const shortM = m.replace(/ 2025| 2026/, "")
                const chipBg = changed ? (rank <= 2 ? "#FCEBEB" : "#F5F5F7") : "#fff"
                const chipBorder = changed ? (rank <= 2 ? "#E24B4A" : "#c7c7cc") : "#e5e5ea"
                const fullColor = valueMode === "band" ? (BAND_COLOR[full as string] ?? "#4b5563") : "#1d1d1f"
                const fullBg = valueMode === "band" ? (BAND_BG[full as string] ?? "#f5f5f7") : "#f5f5f7"
                const dense = months.length > 6
                return (
                  <div key={m} style={{ flex: 1, minWidth: 0, borderRadius: 8, border: `.5px solid ${chipBorder}`, background: chipBg, padding: dense ? "4px 2px" : "6px 8px", textAlign: "center", overflow: "hidden" }}>
                    <div style={{ fontSize: dense ? 8.5 : 10, color: "#86868b", fontWeight: 600, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{shortM}</div>
                    <div style={{ fontSize: dense ? 9 : 11, fontWeight: 700, color: fullColor, background: fullBg, borderRadius: 4, padding: dense ? "1px 2px" : "1px 5px", display: "inline-block", marginBottom: 2, whiteSpace: "nowrap" }}>{fmtVal(full, valueMode)}</div>
                    {changed && (
                      <>
                        <div style={{ fontSize: dense ? 8.5 : 10, color: "#c7c7cc", lineHeight: 1 }}>↓</div>
                        <div style={{ fontSize: dense ? 9 : 11, fontWeight: 700, color: "#E24B4A", background: "#FCEBEB", borderRadius: 4, padding: dense ? "1px 2px" : "1px 5px", display: "inline-block", whiteSpace: "nowrap" }}>{fmtVal(wo, valueMode)}</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <p style={{ fontSize: 14, lineHeight: 1.55, color: "#4b5563", margin: 0 }}>
              {!anyChanged
                ? <><span style={{ fontWeight: 600, color: "#639922" }}>No prediction change.</span> {f.insight}</>
                : f.insight}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

export function AblationGuessIt({ parties, fullEbi, features, chartType, fullEbiMonthly, gtMonthly, months, valueMode, yDomain }: GuessItProps) {
  if (chartType === "line" && fullEbiMonthly && gtMonthly) {
    return <LineGuessIt
      features={features} fullEbiMonthly={fullEbiMonthly} gtMonthly={gtMonthly}
      months={months ?? HS_MONTHS} valueMode={valueMode ?? "band"} yDomain={yDomain ?? [0, 1]}
    />
  }
  const [selected, setSelected] = useState<number | null>(null)
  const [firstReveal, setFirstReveal] = useState<Set<number>>(new Set())
  const [correct, setCorrect] = useState(0)
  const [guessed, setGuessed] = useState(0)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const ranked = [...features]
    .map((f, i) => ({ i, delta: f.delta_jsd ?? ((f.jsd != null && fullEbi) ? f.jsd - fullEbi.jsd : 0) }))
    .sort((a, b) => b.delta - a.delta)

  function rankOf(idx: number) {
    return ranked.findIndex(r => r.i === idx) + 1
  }

  function pick(idx: number) {
    const rank = rankOf(idx)
    setSelected(idx)
    if (!firstReveal.has(idx)) {
      const newSet = new Set(firstReveal).add(idx)
      setFirstReveal(newSet)
      setGuessed(g => g + 1)
      if (rank === 1) {
        setCorrect(c => c + 1)
        setConfettiTrigger(t => t + 1)
      }
    } else if (rank === 1) {
      setConfettiTrigger(t => t + 1)
    }
  }

  const f = selected !== null ? features[selected] : null
  const fullPieSegs = parties.map((p, i) => ({ value: fullEbi?.pred[i] ?? 0, color: BAR_COLORS[i], label: p }))
  const woPieSegs = f ? parties.map((p, i) => ({ value: f.pred[i], color: BAR_COLORS[i], label: p })) : []

  return (
    <div style={{
      background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.25rem 1.4rem",
      display: "flex", flexDirection: "column", minWidth: 0,
    }}>
      <FullPageConfetti trigger={confettiTrigger} />

      {/* title 18px, secondary 14px */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Guess It</span>
          <span style={{ fontSize: 14, color: "#86868b", marginLeft: 8 }}>which feature matters most?</span>
        </div>
        {guessed > 0 && (
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#86868b" }}>
            {correct}/{guessed} top pick
          </span>
        )}
      </div>

      {/* hint body 15px */}
      <p style={{ fontSize: 15, color: "#86868b", marginBottom: 14 }}>
        {selected === null
          ? "Tap a feature. What happens when it's removed?"
          : rankOf(selected) === 1
            ? "Correct — that's the most impactful. Try another?"
            : `Rank #${rankOf(selected)} of ${features.length}. Can you find #1?`}
      </p>

      {/* Chips — body 15px */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {features.map((feat, i) => {
          const isE = feat.tag === "E"
          const isSelected = selected === i
          const isRevealed = firstReveal.has(i)
          const isDimmed = isRevealed && !isSelected
          const base = isE
            ? { bg: "#E8F1FF", border: "#0071e3", color: "#003d8f" }
            : { bg: "#EAF3DE", border: "#639922", color: "#173404" }
          const active = isE
            ? { bg: "#0071e3", border: "#005bb5", color: "#fff" }
            : { bg: "#3B6D11", border: "#27500A", color: "#fff" }
          const style = isSelected ? active : base
          return (
            <span
              key={i}
              onClick={() => pick(i)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "5px 12px", borderRadius: 100,
                border: `1.5px solid ${style.border}`,
                background: style.bg, color: style.color,
                fontSize: 13, fontWeight: 500,
                cursor: "pointer",
                opacity: isDimmed ? 0.4 : 1,
                transition: "opacity .15s",
                userSelect: "none", whiteSpace: "nowrap",
              }}
            >
              [{feat.tag}] {feat.label}
            </span>
          )
        })}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {f === null ? (
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: 8 }}>
            <PieChart segments={fullPieSegs} size={160} title="Full EBI" />
          </div>
        ) : (() => {
          const delta = f.delta_jsd ?? ((f.jsd != null && fullEbi) ? f.jsd - fullEbi.jsd : 0)
          const worse = delta > 0
          const rank = rankOf(selected!)
          const rankLabel = rank === 1 ? "Most critical" : rank === features.length ? "Least critical" : `#${rank} of ${features.length}`
          const bg = !worse ? "#EAF3DE" : rank <= 2 ? "#FCEBEB" : "#F5F5F7"
          const textC = !worse ? "#27500A" : rank <= 2 ? "#A32D2D" : "#4b5563"
          const badgeBg = !worse ? "#639922" : rank <= 2 ? "#E24B4A" : "#888780"

          return (
            <div style={{ borderRadius: 10, background: bg, padding: "1rem 1.1rem", flex: 1 }}>
              {/* badge 12px, great pick 16px */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 12px", borderRadius: 100, background: badgeBg, color: "#fff" }}>
                  {rankLabel}
                </span>
                {rank === 1 && (
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#27500A", animation: "pop-in .35s cubic-bezier(.34,1.56,.64,1) both" }}>
                    Great pick!
                    <style>{`@keyframes pop-in { 0% { transform: scale(0); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }`}</style>
                  </span>
                )}
              </div>
              {/* delta 32px, label 14px */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 500, color: textC }}>
                  {worse ? "+" : ""}{delta.toFixed(4)}
                </span>
                <span style={{ fontSize: 14, color: "#86868b" }}>JSD vs Full EBI</span>
              </div>
              {/* insight 15px body */}
              <p style={{ fontSize: 15, lineHeight: 1.55, color: "#4b5563", marginBottom: 14 }}>{f.insight}</p>

              {/* section label 12px */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <PieChart segments={fullPieSegs} size={110} title="Full EBI" />
                <PieChart segments={woPieSegs} size={110} title={`Without [${f.tag}] ${f.label}`} />
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
