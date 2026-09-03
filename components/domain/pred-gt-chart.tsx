"use client"

import { useState, useCallback, useRef, type ReactNode } from "react"
import type { BreakdownData } from "@/lib/domain-config"
import { MODELS } from "@/lib/domain-config"

interface PredGtChartProps {
  breakdown: BreakdownData
  selectedModel?: string
}

const DONUT_PALETTE = [
  "#0071e3", "#34d399", "#f59e0b", "#a78bfa", "#fb923c",
  "#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#818cf8",
]

const SIZE = 250
const CX = SIZE / 2
const CY = SIZE / 2
const R = 92
const STROKE = 48

function polarToXY(angle: number, r: number): [number, number] {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function buildArcs(values: number[], colors: string[]): { d: string; color: string; index: number }[] {
  const total = values.reduce((s, v) => s + v, 0)
  if (total === 0) return []
  let startAngle = -Math.PI / 2
  return values.map((v, i) => {
    const sweep = (v / total) * 2 * Math.PI
    const endAngle = startAngle + sweep
    const [x1, y1] = polarToXY(startAngle, R)
    const [x2, y2] = polarToXY(endAngle, R)
    const large = sweep > Math.PI ? 1 : 0
    const d = `M ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`
    startAngle = endAngle
    return { d, color: colors[i % colors.length], index: i }
  })
}

function delta(pred: number, gt: number): string {
  const diff = pred - gt
  const pct = (diff * 100).toFixed(1)
  return diff >= 0 ? `+${pct}` : pct
}

function deltaColor(pred: number, gt: number): string {
  const diff = Math.abs(pred - gt)
  if (diff < 0.02) return "#34d399"
  if (diff < 0.06) return "#fbbf24"
  return "#f87171"
}

const MONTHS = ["Aug 2025", "Sep 2025", "Oct 2025"]
const BAND_Y: Record<string, number> = { High: 0.165, Mid: 0.5, Low: 0.835 }
const BANDS = [
  { label: "High", y0: 0,    y1: 0.33, color: "#F0FDF4", text: "#27500A" },
  { label: "Mid",  y0: 0.33, y1: 0.67, color: "#FEFCE8", text: "#854F0B" },
  { label: "Low",  y0: 0.67, y1: 1.0,  color: "#FFF0EE", text: "#A32D2D" },
]

function emojiBars(val: number, max: number, emoji: string): string {
  const n = Math.round((val / max) * 5)
  return emoji.repeat(n) + "○".repeat(5 - n)
}
function tempEmoji(t: number): string {
  if (t >= 32) return "🔥"; if (t >= 28) return "🌡️"; if (t >= 22) return "☀️"; return "❄️"
}

interface MonthlyContext {
  avg_temp: number; epidemic: number; gt_flu: number; gt_cold: number
  gt_immunity: number; gt_competitor: number; promo: boolean
  throw_in: string; holiday: string | null
}

// SVG layout constants
const VB_W = 600, VB_H = 210
const L = 52, R_PAD = 20, TOP = 10, BOT = 26
const cW = VB_W - L - R_PAD
const cH = VB_H - TOP - BOT
const INNER = 20               // dot left/right inset

function xOf(i: number) { return L + INNER + (i / (MONTHS.length - 1)) * (cW - INNER * 2) }
function yOf(band: string) { return TOP + (BAND_Y[band] ?? 0.5) * cH }

function SidePanel({ month, data, pred, gt }: {
  month: string | null; data: MonthlyContext | null; pred: string | null; gt: string | null
}) {
  if (!month || !data || !pred || !gt) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "100%", color: "#c7c7cc", fontSize: 11, gap: 6, userSelect: "none", padding: "10px 12px", boxSizing: "border-box" }}>
        <span style={{ fontSize: 22 }}>👆</span>
        <span>Hover a month</span>
      </div>
    )
  }
  const correct = pred === gt
  const rows: [string, string, string][] = [
    ["🦠", "Epidemic",  emojiBars(data.epidemic, 60, "🦠")],
    ["🤧", "Flu",       emojiBars(data.gt_flu, 20, "🤧")],
    ["🌡️", `Temp`,     `${data.avg_temp}°C ${tempEmoji(data.avg_temp)}`],
    ["📢", "Promo",     data.promo ? "Yes ✅" : "No"],
    ["🎁", "Throw-in",  data.throw_in],
    ...(data.gt_cold > 0       ? [["😷", "Cold",       emojiBars(data.gt_cold, 10, "😷")] as [string,string,string]] : []),
    ...(data.gt_immunity > 0   ? [["💪", "Immunity",   emojiBars(data.gt_immunity, 1, "💪")] as [string,string,string]] : []),
    ...(data.gt_competitor > 0 ? [["🔍", "Competitor", emojiBars(data.gt_competitor, 2, "🔍")] as [string,string,string]] : []),
    ...(data.holiday            ? [["🎉", data.holiday as string, ""] as [string,string,string]] : []),
  ]
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "10px 12px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#1d1d1f" }}>{month}</span>
        <span style={{ fontSize: 10, fontWeight: 600,
          color: correct ? "#15803d" : "#b91c1c",
          background: correct ? "#f0fdf4" : "#fff1f2",
          borderRadius: 6, padding: "2px 7px" }}>
          {correct ? "✓ correct" : "✗ miss"}
        </span>
      </div>
      <div style={{ height: ".5px", background: "#f0f0f5", marginBottom: 8 }} />
      <div style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: "0 5px", alignItems: "center", overflow: "hidden" }}>
        {rows.map(([icon, label, val], i) => (
          <>
            <span key={`i${i}`} style={{ fontSize: 12, lineHeight: 2 }}>{icon}</span>
            <span key={`l${i}`} style={{ fontSize: 10, color: "#6e6e73", lineHeight: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
            <span key={`v${i}`} style={{ fontSize: 10, textAlign: "right", lineHeight: 2, color: "#1d1d1f", fontVariantNumeric: "tabular-nums", letterSpacing: "-.2px", whiteSpace: "nowrap" }}>{val}</span>
          </>
        ))}
      </div>
    </div>
  )
}

function ClassProbLineChart({ breakdown, selectedModel }: { breakdown: BreakdownData; selectedModel: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const monthly    = (breakdown as any).monthly as Record<string, Record<string, string>> | undefined
  const gtMonthly  = (breakdown as any).gt_monthly as Record<string, string> | undefined
  const monthlyCtx = (breakdown as any).monthly_context as Record<string, MonthlyContext> | undefined
  const predByMonth = monthly?.[selectedModel] ?? {}
  const modelLabel  = MODELS.find(m => m.value === selectedModel)?.label ?? selectedModel

  const predPts = MONTHS.map((m, i) => ({ x: xOf(i), y: yOf(predByMonth[m] ?? "Mid"), band: predByMonth[m] ?? "Mid" }))
  const gtPts   = MONTHS.map((m, i) => ({ x: xOf(i), y: yOf(gtMonthly?.[m]  ?? "Mid"), band: gtMonthly?.[m]  ?? "Mid" }))

  const predPath = predPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const gtPath   = gtPts.map((p, i)   => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  const ttMonth = hoveredIdx !== null ? MONTHS[hoveredIdx] : null
  const ttData  = ttMonth ? monthlyCtx?.[ttMonth] ?? null : null
  const ttPred  = ttMonth ? predByMonth[ttMonth] ?? null : null
  const ttGt    = ttMonth ? gtMonthly?.[ttMonth] ?? null : null

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.1rem 1.25rem", minHeight: 380 }}>
      {/* Header */}
      <div style={{ marginBottom: "0.65rem" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Prediction vs Ground Truth</div>
        <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>{modelLabel}</div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12, color: "#6e6e73" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#1a6bbf" strokeWidth="2.5"/><circle cx="14" cy="5" r="3.5" fill="#1a6bbf"/></svg>
          EBI prediction
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#c07c1a" strokeWidth="2.5" strokeDasharray="5,3"/><circle cx="14" cy="5" r="3.5" fill="#c07c1a"/></svg>
          Ground truth
        </div>
      </div>
      {/* 75/25 split — fixed height prevents jumping when side panel rows change */}
      <div className="ebi-panel-split" style={{ display: "grid", gridTemplateColumns: "75% 25%", gap: 0, border: ".5px solid #e5e5ea", borderRadius: 12, overflow: "hidden", height: 230 }}>
        {/* Chart — flex center vertically */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0 4px", height: "100%", boxSizing: "border-box" }}>
        <svg ref={svgRef} viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
          {BANDS.map(b => (
            <rect key={b.label} x={L} y={TOP + b.y0 * cH} width={cW} height={(b.y1 - b.y0) * cH} fill={b.color} />
          ))}
          {[0.33, 0.67].map(y => (
            <line key={y} x1={L} y1={TOP + y * cH} x2={L + cW} y2={TOP + y * cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
          ))}
          {BANDS.map(b => (
            <text key={b.label} x={L - 6} y={TOP + (b.y0 + (b.y1 - b.y0) / 2) * cH + 4}
              textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill={b.text} fontWeight={600}>
              {b.label}
            </text>
          ))}
          <path d={gtPath} fill="none" stroke="#c07c1a" strokeWidth={2.5} strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={predPath} fill="none" stroke="#1a6bbf" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {gtPts.map((p, i) => (
            <circle key={`gt${i}`} cx={p.x} cy={p.y} r={5} fill="#c07c1a" stroke="#fff" strokeWidth={1.5} />
          ))}
          {predPts.map((p, i) => (
            <circle key={`pred${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 7 : 5.5}
              fill="#1a6bbf" stroke="#fff" strokeWidth={2} style={{ transition: "r .12s" }} />
          ))}
          {MONTHS.map((m, i) => predPts[i].band === gtPts[i].band && (
            <text key={`chk${i}`} x={predPts[i].x} y={predPts[i].y - 11}
              textAnchor="middle" fontSize={11} fill="#15803d" fontWeight={700}>✓</text>
          ))}
          {MONTHS.map((m, i) => (
            <text key={`lbl${i}`} x={xOf(i)} y={VB_H - 6}
              textAnchor="middle" fontSize={11} fontFamily="-apple-system,sans-serif"
              fill={hoveredIdx === i ? "#1d1d1f" : "#86868b"} fontWeight={hoveredIdx === i ? 700 : 400}>{m}</text>
          ))}
          {/* Hit zones — equal thirds */}
          {(() => {
            const zoneW = cW / MONTHS.length
            const zoneXs  = MONTHS.map((_, i) => L + i * zoneW)
            const zoneX2s = MONTHS.map((_, i) => L + (i + 1) * zoneW)
            return (
              <>
                {hoveredIdx !== null && (
                  <rect x={zoneXs[hoveredIdx]} y={TOP} width={zoneX2s[hoveredIdx] - zoneXs[hoveredIdx]} height={cH}
                    fill="rgba(0,0,0,0.04)" rx={4} pointerEvents="none" />
                )}
                {MONTHS.map((_, i) => (
                  <rect key={`hit${i}`} x={zoneXs[i]} y={TOP} width={zoneX2s[i] - zoneXs[i]} height={cH}
                    fill="transparent" style={{ cursor: "crosshair" }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                ))}
              </>
            )
          })()}
        </svg>
        </div>
        {/* Side panel */}
        <div style={{ borderLeft: ".5px solid #e5e5ea", background: "#fff", height: "100%", overflow: "hidden", boxSizing: "border-box" }}>
          <SidePanel month={ttMonth} data={ttData} pred={ttPred} gt={ttGt} />
        </div>
      </div>
    </div>
  )
}

const SR_MONTHS_FALLBACK = [
  "Apr 2025", "May 2025", "Jun 2025", "Jul 2025", "Aug 2025", "Sep 2025",
  "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026",
]

function srXof(i: number, n: number) { return L + INNER + (i / (n - 1)) * (cW - INNER * 2) }
function srYof(v: number, lo: number, hi: number) { return TOP + (1 - (v - lo) / (hi - lo)) * cH }

function SuccessRateMonthlyChart({ breakdown, selectedModel }: { breakdown: BreakdownData; selectedModel: string }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const months    = (breakdown as any).months as string[] ?? SR_MONTHS_FALLBACK
  const monthly    = (breakdown as any).monthly as Record<string, Record<string, number>> | undefined
  const gtMonthly  = (breakdown as any).gt_monthly as Record<string, number> | undefined
  const predByMonth = monthly?.[selectedModel] ?? {}
  const modelLabel  = MODELS.find(m => m.value === selectedModel)?.label ?? selectedModel

  const predVals = months.map(m => predByMonth[m] ?? 0)
  const gtVals = months.map(m => gtMonthly?.[m] ?? 0)
  const allVals = [...predVals, ...gtVals]
  const lo = Math.max(0, Math.floor(Math.min(...allVals) * 20) / 20 - 0.05)
  const hi = Math.min(1, Math.ceil(Math.max(...allVals) * 20) / 20 + 0.05)

  const predPts = months.map((m, i) => ({ x: srXof(i, months.length), y: srYof(predByMonth[m] ?? 0, lo, hi) }))
  const gtPts   = months.map((m, i) => ({ x: srXof(i, months.length), y: srYof(gtMonthly?.[m]  ?? 0, lo, hi) }))

  const predPath = predPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const gtPath   = gtPts.map((p, i)   => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  const ttMonth = hoveredIdx !== null ? months[hoveredIdx] : null
  const ttPred  = ttMonth ? predByMonth[ttMonth] : null
  const ttGt    = ttMonth ? gtMonthly?.[ttMonth] : null

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.1rem 1.25rem", minHeight: 380 }}>
      <div style={{ marginBottom: "0.65rem" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Prediction vs Ground Truth</div>
        <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>{modelLabel}</div>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 12, color: "#6e6e73" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#1a6bbf" strokeWidth="2.5"/><circle cx="14" cy="5" r="3.5" fill="#1a6bbf"/></svg>
          EBI prediction
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="#c07c1a" strokeWidth="2.5" strokeDasharray="5,3"/><circle cx="14" cy="5" r="3.5" fill="#c07c1a"/></svg>
          Ground truth
        </div>
      </div>
      <div className="ebi-panel-split" style={{ display: "grid", gridTemplateColumns: "75% 25%", gap: 0, border: ".5px solid #e5e5ea", borderRadius: 12, overflow: "hidden", height: 230 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0 4px", height: "100%", boxSizing: "border-box" }}>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
            {[0, 0.5, 1].map(f => (
              <line key={f} x1={L} y1={TOP + f * cH} x2={L + cW} y2={TOP + f * cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
            ))}
            {[0, 0.5, 1].map(f => (
              <text key={f} x={L - 6} y={TOP + f * cH + 4}
                textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill="#86868b" fontWeight={600}>
                {`${((hi - f * (hi - lo)) * 100).toFixed(0)}%`}
              </text>
            ))}
            <path d={gtPath} fill="none" stroke="#c07c1a" strokeWidth={2} strokeDasharray="6,4" strokeLinecap="round" strokeLinejoin="round" />
            <path d={predPath} fill="none" stroke="#1a6bbf" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {gtPts.map((p, i) => (
              <circle key={`gt${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 4.5 : 3} fill="#c07c1a" stroke="#fff" strokeWidth={1.2} />
            ))}
            {predPts.map((p, i) => (
              <circle key={`pred${i}`} cx={p.x} cy={p.y} r={hoveredIdx === i ? 5.5 : 3.5}
                fill="#1a6bbf" stroke="#fff" strokeWidth={1.5} style={{ transition: "r .12s" }} />
            ))}
            {months.map((m, i) => (
              <text key={`lbl${i}`} x={srXof(i, months.length)} y={VB_H - 6}
                textAnchor="middle" fontSize={9.5} fontFamily="-apple-system,sans-serif"
                fill={hoveredIdx === i ? "#1d1d1f" : "#86868b"} fontWeight={hoveredIdx === i ? 700 : 400}>{m.replace(" 20", " '")}</text>
            ))}
            {hoveredIdx !== null && (() => {
              const zoneW = cW / months.length
              return (
                <rect x={L + hoveredIdx * zoneW} y={TOP} width={zoneW} height={cH}
                  fill="rgba(0,0,0,0.04)" rx={4} pointerEvents="none" />
              )
            })()}
            {months.map((_, i) => {
              const zoneW = cW / months.length
              return (
                <rect key={`hit${i}`} x={L + i * zoneW} y={TOP} width={zoneW} height={cH}
                  fill="transparent" style={{ cursor: "crosshair" }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              )
            })}
          </svg>
        </div>
        <div style={{ borderLeft: ".5px solid #e5e5ea", background: "#fff", height: "100%", overflow: "hidden", boxSizing: "border-box" }}>
          {!ttMonth ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: "100%", color: "#c7c7cc", fontSize: 11, gap: 6, userSelect: "none" }}>
              <span style={{ fontSize: 22 }}>👆</span>
              <span>Hover a month</span>
            </div>
          ) : (
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1d1d1f" }}>{ttMonth}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#1a6bbf", fontWeight: 600 }}>EBI prediction</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f" }}>{ttPred != null ? `${(ttPred * 100).toFixed(1)}%` : "—"}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#c07c1a", fontWeight: 600 }}>Ground truth</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f" }}>{ttGt != null ? `${(ttGt * 100).toFixed(1)}%` : "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PredGtChart({ breakdown, selectedModel: externalModel }: PredGtChartProps) {
  if (breakdown.type === "class_probability") {
    return <ClassProbLineChart breakdown={breakdown} selectedModel={externalModel ?? MODELS[0].value} />
  }
  if (breakdown.type === "success_rate_monthly") {
    return <SuccessRateMonthlyChart breakdown={breakdown} selectedModel={externalModel ?? MODELS[0].value} />
  }
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const selectedModel = externalModel ?? MODELS[0].value
  const predValues = breakdown.predictions[selectedModel] ?? []
  const arcs = buildArcs(predValues, DONUT_PALETTE)

  const handleArcEnter = useCallback((i: number) => setHoveredIndex(i), [])
  const handleArcLeave = useCallback(() => setHoveredIndex(null), [])

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.1rem 1.25rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>
          Prediction vs Ground Truth
        </div>
        <div style={{ fontSize: 11, color: "#86868b", marginTop: 2 }}>
          {MODELS.find(m => m.value === selectedModel)?.label ?? selectedModel}
        </div>
      </div>

      <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
        {/* Donut */}
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: "100%", maxWidth: SIZE, height: "auto" }}>
            {/* Background ring */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f5f5f7" strokeWidth={STROKE} />
            {arcs.map(arc => (
              <path
                key={arc.index}
                d={arc.d}
                fill="none"
                stroke={arc.color}
                strokeWidth={hoveredIndex === arc.index ? STROKE + 3 : STROKE}
                strokeLinecap="butt"
                style={{ cursor: "pointer", transition: "stroke-width .15s" }}
                onMouseEnter={() => handleArcEnter(arc.index)}
                onMouseLeave={handleArcLeave}
              />
            ))}
            {/* Center label */}
            <text x={CX} y={CY - 22} textAnchor="middle" fontSize={13} fill="#86868b">Pred</text>
            {hoveredIndex !== null ? (
              <text x={CX} y={CY + 8} textAnchor="middle" fontSize={16} fontWeight="700" fill="#1d1d1f">
                {`${(predValues[hoveredIndex] * 100).toFixed(1)}%`}
              </text>
            ) : (() => {
              const label = MODELS.find(m => m.value === selectedModel)?.label ?? ""
              const parts = label.split(" ")
              const line1 = parts.slice(0, Math.ceil(parts.length / 2)).join(" ")
              const line2 = parts.slice(Math.ceil(parts.length / 2)).join(" ")
              return <>
                <text x={CX} y={CY - 2} textAnchor="middle" fontSize={13} fontWeight="700" fill="#1d1d1f">{line1}</text>
                <text x={CX} y={CY + 16} textAnchor="middle" fontSize={13} fontWeight="700" fill="#1d1d1f">{line2}</text>
              </>
            })()}
          </svg>

          {/* Donut tooltip */}
          {hoveredIndex !== null && (
            <div style={{
              position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
              background: "#1d1d1f", color: "#fff", fontSize: 11, padding: "4px 9px",
              borderRadius: 7, pointerEvents: "none", whiteSpace: "nowrap", marginBottom: 4,
            }}>
              {breakdown.labels[hoveredIndex]}：{(predValues[hoveredIndex] * 100).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "23%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: ".5px solid #e5e5ea" }}>
              <th style={{ textAlign: "left", padding: "3px 6px 3px 0", fontWeight: 500, color: "#86868b" }}>
                {breakdown.unit === "party" ? "Party" : breakdown.unit === "class" ? "Class" : "Category"}
              </th>
              <th style={{ textAlign: "right", padding: "3px 0", fontWeight: 500, color: "#0071e3", whiteSpace: "nowrap" }}>Pred</th>
              <th style={{ textAlign: "right", padding: "3px 0 3px 8px", fontWeight: 500, color: "#86868b", whiteSpace: "nowrap" }}>GT</th>
              <th style={{ textAlign: "right", padding: "3px 0 3px 8px", fontWeight: 500, color: "#86868b" }}>Δ</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.labels.map((label, i) => {
              const pred = predValues[i] ?? 0
              const gt = breakdown.gt[i] ?? 0
              const isHovered = hoveredIndex === i
              return (
                <tr
                  key={label}
                  style={{
                    borderBottom: ".5px solid #f5f5f7",
                    background: isHovered ? "#f5f5f7" : "transparent",
                    cursor: "pointer",
                    transition: "background .12s",
                  }}
                  onMouseEnter={() => handleArcEnter(i)}
                  onMouseLeave={handleArcLeave}
                >
                  <td style={{ padding: "7px 6px 7px 0", whiteSpace: "nowrap" }}>
                    <span style={{
                      display: "inline-block", width: 8, height: 8,
                      background: DONUT_PALETTE[i % DONUT_PALETTE.length],
                      borderRadius: 2, marginRight: 5, flexShrink: 0,
                    }} />
                    <span style={{ color: "#1d1d1f" }}>{label}</span>
                  </td>
                  <td style={{ textAlign: "right", color: "#0071e3", fontWeight: 600, whiteSpace: "nowrap", padding: "7px 0" }}>
                    {(pred * 100).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "right", color: "#6e6e73", padding: "7px 0 7px 8px", whiteSpace: "nowrap" }}>
                    {(gt * 100).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: deltaColor(pred, gt), padding: "7px 0 7px 8px", whiteSpace: "nowrap" }}>
                    {delta(pred, gt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
