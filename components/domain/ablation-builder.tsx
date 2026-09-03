"use client"

import { useState } from "react"
import { PieChart } from "./pie-chart"

interface BuilderCondition {
  label: string
  tag?: string
  jsd: number
  rho?: number
  mae: number
  pred: number[]
}

interface LineBuilderCondition {
  label: string
  jsd: number
  monthly: Record<string, string | number>
}

interface BuilderProps {
  parties: string[]
  builder: Record<string, BuilderCondition | LineBuilderCondition>
  chartType?: "donut" | "line"
  gtMonthly?: Record<string, string | number>
  months?: string[]
  valueMode?: "band" | "percent"
  yDomain?: [number, number]
}

function fmtBuilderVal(v: string | number, valueMode: "band" | "percent"): string {
  if (valueMode === "percent" && typeof v === "number") return `${(v * 100).toFixed(1)}%`
  return String(v)
}

const BAR_COLORS = ["#0071e3","#34c759","#ff9500","#af52de","#ff3b30","#5ac8fa","#8e8e93"]

const LINE_COLORS: Record<string, string> = {
  none:   "#888780",
  E_only: "#0071e3",
  B_only: "#639922",
  full:   "#1d1d1f",
}
const LINE_DASHES: Record<string, number[]> = {
  none:   [4, 4],
  E_only: [5, 3],
  B_only: [5, 3],
  full:   [],
}

const HS_MONTHS = ["Aug 2025", "Sep 2025", "Oct 2025"]
const HS_BAND_Y: Record<string, number> = { High: 0.165, Mid: 0.5, Low: 0.835 }
const HS_BANDS = [
  { label: "High", y0: 0,    y1: 0.33, color: "#F0FDF4", text: "#27500A" },
  { label: "Mid",  y0: 0.33, y1: 0.67, color: "#FEFCE8", text: "#854F0B" },
  { label: "Low",  y0: 0.67, y1: 1.0,  color: "#FFF0EE", text: "#A32D2D" },
]

// SVG layout constants — same as pred-gt-chart / guess-it
const BLD_VB_W = 600, BLD_VB_H = 210
const BLD_L = 52, BLD_R = 20, BLD_TOP = 10, BLD_BOT = 26
const BLD_cW = BLD_VB_W - BLD_L - BLD_R
const BLD_cH = BLD_VB_H - BLD_TOP - BLD_BOT
const BLD_INNER = 20

function bldXof(i: number, n: number) { return BLD_L + BLD_INNER + (i / (n - 1)) * (BLD_cW - BLD_INNER * 2) }
function bldYof(v: string | number, valueMode: "band" | "percent", yDomain: [number, number]) {
  if (valueMode === "percent") {
    const [lo, hi] = yDomain
    const num = typeof v === "number" ? v : (lo + hi) / 2
    return BLD_TOP + (1 - (num - lo) / (hi - lo)) * BLD_cH
  }
  return BLD_TOP + (HS_BAND_Y[v as string] ?? 0.5) * BLD_cH
}

const BAND_COLOR: Record<string, string> = { High: "#27500A", Mid: "#854F0B", Low: "#A32D2D" }
const BAND_BG: Record<string, string> = { High: "#EAF3DE", Mid: "#FEFCE8", Low: "#FFF0EE" }

function LineBuilder({ builder, gtMonthly, months, valueMode, yDomain }: {
  builder: Record<string, LineBuilderCondition>; gtMonthly: Record<string, string | number>
  months: string[]; valueMode: "band" | "percent"; yDomain: [number, number]
}) {
  const ALL_KEYS = ["none", "E_only", "B_only", "full"]
  const ALL_LABELS: Record<string, string> = { none: "No context", E_only: "[E] only", B_only: "[B] only", full: "Full EBI" }
  const [active, setActive] = useState<Set<string>>(new Set(["full"]))
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  function toggle(key: string) {
    setActive(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const zoneW = BLD_cW / months.length
  const hoveredMonth = hoveredIdx !== null ? months[hoveredIdx] : null
  const activeKeys = ALL_KEYS.filter(k => active.has(k))

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.25rem 1.4rem", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Builder</span>
        <span style={{ fontSize: 14, color: "#86868b", marginLeft: 8 }}>toggle conditions to see their contribution</span>
      </div>

      {/* Condition pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        {ALL_KEYS.map(key => {
          const on = active.has(key)
          const color = LINE_COLORS[key]
          return (
            <span key={key} onClick={() => toggle(key)} style={{
              padding: "5px 14px", borderRadius: 100, fontSize: 13, fontWeight: 500,
              cursor: "pointer", userSelect: "none",
              border: on ? `1.5px solid ${color}` : ".5px solid #e5e5ea",
              background: on ? color + "22" : "#f5f5f7",
              color: on ? color : "#86868b",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="16" height="6">
                <line x1="0" y1="3" x2="16" y2="3" stroke={color} strokeWidth="2" strokeDasharray={LINE_DASHES[key].join(",")} />
              </svg>
              {ALL_LABELS[key]}
            </span>
          )
        })}
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#86868b", paddingLeft: 4 }}>
          <svg width="16" height="6"><line x1="0" y1="3" x2="16" y2="3" stroke="#BA7517" strokeWidth="1.5" strokeDasharray="4,3"/></svg>
          Ground truth
        </span>
      </div>

      {/* 75:25 chart + side panel */}
      <div className="ebi-panel-split" style={{ display: "grid", gridTemplateColumns: "75% 25%", border: ".5px solid #e5e5ea", borderRadius: 12, overflow: "hidden", height: 230, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", padding: "8px 0 4px", height: "100%", boxSizing: "border-box" }}>
          <svg viewBox={`0 0 ${BLD_VB_W} ${BLD_VB_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
            {valueMode === "band" ? (
              <>
                {HS_BANDS.map(b => (
                  <rect key={b.label} x={BLD_L} y={BLD_TOP + b.y0 * BLD_cH} width={BLD_cW} height={(b.y1 - b.y0) * BLD_cH} fill={b.color} />
                ))}
                {[0.33, 0.67].map(y => (
                  <line key={y} x1={BLD_L} y1={BLD_TOP + y * BLD_cH} x2={BLD_L + BLD_cW} y2={BLD_TOP + y * BLD_cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                ))}
                {HS_BANDS.map(b => (
                  <text key={b.label} x={BLD_L - 6} y={BLD_TOP + (b.y0 + (b.y1 - b.y0) / 2) * BLD_cH + 4}
                    textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill={b.text} fontWeight={600}>{b.label}</text>
                ))}
              </>
            ) : (
              <>
                {[0, 0.5, 1].map(f => (
                  <line key={f} x1={BLD_L} y1={BLD_TOP + f * BLD_cH} x2={BLD_L + BLD_cW} y2={BLD_TOP + f * BLD_cH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                ))}
                {[0, 0.5, 1].map(f => (
                  <text key={f} x={BLD_L - 6} y={BLD_TOP + f * BLD_cH + 4}
                    textAnchor="end" fontSize={11} fontFamily="-apple-system,sans-serif" fill="#86868b" fontWeight={600}>
                    {`${((yDomain[1] - f * (yDomain[1] - yDomain[0])) * 100).toFixed(0)}%`}
                  </text>
                ))}
              </>
            )}
            {/* GT line */}
            {(() => {
              const pts = months.map((m, i) => ({ x: bldXof(i, months.length), y: bldYof(gtMonthly[m] ?? "Mid", valueMode, yDomain) }))
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
              return (
                <g>
                  <path d={d} fill="none" stroke="#BA7517" strokeWidth={1.5} strokeDasharray="4,3" strokeLinecap="round" />
                  {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={hoveredIdx === i ? 5.5 : 3.5} fill="#BA7517" stroke="#fff" strokeWidth={1.5} />)}
                </g>
              )
            })()}
            {/* Active condition lines */}
            {activeKeys.map(key => {
              const data = builder[key]
              if (!data) return null
              const pts = months.map((m, i) => ({ x: bldXof(i, months.length), y: bldYof(data.monthly[m] ?? "Mid", valueMode, yDomain) }))
              const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
              const color = LINE_COLORS[key]
              const dash = LINE_DASHES[key].join(",")
              return (
                <g key={key}>
                  <path d={d} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dash || undefined} strokeLinecap="round" strokeLinejoin="round" />
                  {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} fill={color} stroke="#fff" strokeWidth={1.5} />)}
                </g>
              )
            })}
            {/* Month labels */}
            {months.map((m, i) => (
              <text key={m} x={bldXof(i, months.length)} y={BLD_VB_H - 6}
                textAnchor="middle" fontSize={months.length > 6 ? 9 : 11} fontFamily="-apple-system,sans-serif"
                fill={hoveredIdx === i ? "#1d1d1f" : "#86868b"} fontWeight={hoveredIdx === i ? 700 : 400}>
                {months.length > 6 ? m.replace(" 20", " '") : m}
              </text>
            ))}
            {/* Hover highlight */}
            {hoveredIdx !== null && (
              <rect x={BLD_L + hoveredIdx * zoneW} y={BLD_TOP} width={zoneW} height={BLD_cH}
                fill="rgba(0,0,0,0.04)" rx={4} pointerEvents="none" />
            )}
            {/* Hit zones */}
            {months.map((_, i) => (
              <rect key={i} x={BLD_L + i * zoneW} y={0} width={zoneW} height={BLD_VB_H}
                fill="transparent" style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />
            ))}
          </svg>
        </div>
        <div style={{ borderLeft: ".5px solid #e5e5ea", background: "#fff" }}>
          {!hoveredMonth ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 4 }}>
              <span style={{ fontSize: 18 }}>👆</span>
              <span style={{ fontSize: 11, color: "#c7c7cc", textAlign: "center", lineHeight: 1.4 }}>Hover a month</span>
            </div>
          ) : (
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1d1d1f", marginBottom: 2 }}>{hoveredMonth}</div>
              {activeKeys.map(key => {
                const data = builder[key]
                const val = data?.monthly[hoveredMonth] ?? "—"
                const color = LINE_COLORS[key]
                const bandC = valueMode === "band" ? (BAND_COLOR[val as string] ?? "#4b5563") : "#1d1d1f"
                const bandBg = valueMode === "band" ? (BAND_BG[val as string] ?? "#f5f5f7") : "#f5f5f7"
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 10, color, fontWeight: 600 }}>{ALL_LABELS[key]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: bandC, background: bandBg, borderRadius: 6, padding: "2px 6px", display: "inline-block" }}>{fmtBuilderVal(val, valueMode)}</span>
                  </div>
                )
              })}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: "#BA7517", fontWeight: 600 }}>Ground truth</span>
                {(() => {
                  const val = gtMonthly[hoveredMonth] ?? "—"
                  const bandC = valueMode === "band" ? (BAND_COLOR[val as string] ?? "#4b5563") : "#1d1d1f"
                  const bandBg = valueMode === "band" ? (BAND_BG[val as string] ?? "#f5f5f7") : "#f5f5f7"
                  return <span style={{ fontSize: 12, fontWeight: 700, color: bandC, background: bandBg, borderRadius: 6, padding: "2px 6px", display: "inline-block" }}>{fmtBuilderVal(val, valueMode)}</span>
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSD metrics — election-jp style: all 4 conditions, compact gray chips */}
      <div style={{ display: "flex", gap: 8 }}>
        {ALL_KEYS.map(key => {
          const data = builder[key]
          const isActive = active.has(key)
          const color = LINE_COLORS[key]
          return (
            <div key={key} onClick={() => toggle(key)} style={{
              flex: 1, borderRadius: 8, padding: ".5rem .6rem", textAlign: "center", cursor: "pointer",
              background: isActive ? color + "12" : "#f5f5f7",
              border: isActive ? `1.5px solid ${color}` : ".5px solid #e5e5ea",
              transition: "all .15s",
            }}>
              <div style={{ fontSize: 11, color: isActive ? color : "#86868b", fontWeight: 600, letterSpacing: ".02em", marginBottom: 2 }}>
                {ALL_LABELS[key]}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isActive ? color : "#c7c7cc" }}>
                {data ? data.jsd.toFixed(3) : "—"}
              </div>
              <div style={{ fontSize: 9, color: isActive ? color : "#c7c7cc", marginTop: 1, opacity: 0.8 }}>JSD</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AblationBuilder({ parties, builder, chartType, gtMonthly, months, valueMode, yDomain }: BuilderProps) {
  if (chartType === "line" && gtMonthly) {
    return <LineBuilder
      builder={builder as Record<string, LineBuilderCondition>} gtMonthly={gtMonthly}
      months={months ?? HS_MONTHS} valueMode={valueMode ?? "band"} yDomain={yDomain ?? [0, 1]}
    />
  }
  const [key, setKey] = useState<"none" | "E_only" | "B_only" | "full">("full")
  const data = builder[key]

  const chipLabel: Record<string, string> = { none: "No context", E_only: "[E] only", B_only: "[B] only", full: "Full EBI" }

  const donutData = data as BuilderCondition | undefined
  const segments = donutData ? parties.map((p, i) => ({
    value: donutData.pred[i],
    color: BAR_COLORS[i],
    label: p,
  })) : []

  return (
    <div style={{
      background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.25rem 1.4rem",
      display: "flex", flexDirection: "column", minWidth: 0,
    }}>
      {/* title 18px */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>Builder</span>
        <span style={{ fontSize: 14, color: "#86868b", marginLeft: 8 }}>toggle conditions to see their contribution</span>
      </div>

      {/* Condition pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {(["none", "E_only", "B_only", "full"] as const).map(k => {
          const on = key === k
          const color = LINE_COLORS[k]
          return (
            <span key={k} onClick={() => setKey(k)} style={{
              padding: "5px 14px", borderRadius: 100, fontSize: 13, fontWeight: 500,
              cursor: "pointer", userSelect: "none",
              border: on ? `1.5px solid ${color}` : ".5px solid #e5e5ea",
              background: on ? color + "22" : "#f5f5f7",
              color: on ? color : "#86868b",
            }}>
              {chipLabel[k]}
            </span>
          )
        })}
      </div>

      {/* Pie chart */}
      {data && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <PieChart segments={segments} size={160} />
        </div>
      )}

      {/* JSD metrics — all 4 conditions, compact clickable chips */}
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        {(["none", "E_only", "B_only", "full"] as const).map(k => {
          const d = builder[k] as BuilderCondition | undefined
          const isActive = key === k
          const color = LINE_COLORS[k]
          return (
            <div key={k} onClick={() => setKey(k)} style={{
              flex: 1, borderRadius: 8, padding: ".5rem .6rem", textAlign: "center", cursor: "pointer",
              background: isActive ? color + "12" : "#f5f5f7",
              border: isActive ? `1.5px solid ${color}` : ".5px solid #e5e5ea",
              transition: "all .15s",
            }}>
              <div style={{ fontSize: 11, color: isActive ? color : "#86868b", fontWeight: 600, letterSpacing: ".02em", marginBottom: 2 }}>
                {chipLabel[k]}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: isActive ? color : "#c7c7cc" }}>
                {d ? d.jsd.toFixed(3) : "—"}
              </div>
              <div style={{ fontSize: 9, color: isActive ? color : "#c7c7cc", marginTop: 1, opacity: 0.8 }}>JSD</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
