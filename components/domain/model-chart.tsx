"use client"

import { useState } from "react"
import type { ResultRow } from "@/lib/domain-config"

interface ModelChartProps {
  rows: ResultRow[]
  selectedModel: string
}

type MetricKey = "spearman_rho" | "jsd" | "mae"

const METRIC_OPTIONS: { key: MetricKey; label: string; direction: "↑" | "↓" }[] = [
  { key: "jsd",          label: "JSD", direction: "↓" },
  { key: "spearman_rho", label: "ρ",   direction: "↑" },
  { key: "mae",          label: "MAE", direction: "↓" },
]

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  ebi:                  { label: "EBI",   bg: "#dbeafe", text: "#1d4ed8" },
  baseline_statistical: { label: "Stat.", bg: "#fef9c3", text: "#854d0e" },
  baseline_ml:          { label: "ML",    bg: "#dcfce7", text: "#166534" },
  baseline_sota:        { label: "SOTA",  bg: "#ede9fe", text: "#5b21b6" },
  baseline_naive:       { label: "Naive", bg: "#f3f4f6", text: "#4b5563" },
  baseline_reference:   { label: "Ref.",  bg: "#f3f4f6", text: "#4b5563" },
  reference:            { label: "Ref.",  bg: "#f3f4f6", text: "#4b5563" },
}

// Bar fill by type — consistent with badge color family
const TYPE_BAR_PALETTE: Record<string, string[]> = {
  ebi:                  ["#0071e3", "#3b82f6", "#60a5fa"],
  baseline_statistical: ["#f59e0b", "#fbbf24", "#fcd34d"],
  baseline_ml:          ["#22c55e", "#4ade80", "#86efac"],
  baseline_sota:        ["#8b5cf6", "#a78bfa", "#c4b5fd"],
  reference:            ["#9ca3af", "#d1d5db"],
}

const TYPE_BAR_COLOR: Record<string, string> = {
  ebi:                  "#0071e3",
  baseline_statistical: "#f59e0b",
  baseline_ml:          "#22c55e",
  baseline_sota:        "#8b5cf6",
  baseline_naive:       "#9ca3af",
  baseline_reference:   "#9ca3af",
  reference:            "#9ca3af",
}

function buildBarColors(rows: ResultRow[]): string[] {
  return rows.map(r => TYPE_BAR_COLOR[r.type] ?? "#9ca3af")
}

function badgeFor(type: string) {
  return TYPE_BADGE[type] ?? { label: type, bg: "#f3f4f6", text: "#4b5563" }
}

function modelLabel(model: string): string {
  if (model.startsWith("rss_"))  return "RSS"
  if (model.includes("gpt-4.1")) return "GPT-4.1"
  if (model.includes("haiku"))   return "Haiku 4.5"
  if (model.includes("sonnet"))  return "Sonnet 4.5"
  if (model === "moving_avg_3election") return "3-election avg"
  if (model === "moving_avg_3m") return "Moving avg (3M)"
  if (model === "lstprompt") return "LSTPrompt"
  if (model === "carry_forward") return "Carry forward"
  return model
}

export function ModelChart({ rows, selectedModel }: ModelChartProps) {
  const [metric, setMetric] = useState<MetricKey>("jsd")
  const [tooltip, setTooltip] = useState<{ label: string; value: number; x: number; y: number } | null>(null)

  const option = METRIC_OPTIONS.find(m => m.key === metric)!

  const filtered = rows.filter(r => {
    if (r.type === "baseline_sota" && r.model.startsWith("rss_")) {
      return r.model.includes(selectedModel.split("-").slice(0, 2).join("-"))
    }
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    const av = a[metric] ?? (metric === "spearman_rho" ? -Infinity : Infinity)
    const bv = b[metric] ?? (metric === "spearman_rho" ? -Infinity : Infinity)
    return metric === "spearman_rho" ? (bv as number) - (av as number) : (av as number) - (bv as number)
  })

  const nonNullVals = sorted.map(r => r[metric] as number).filter(v => v !== null && v !== undefined)
  const maxVal = nonNullVals.length ? Math.max(...nonNullVals) : 1
  const minVal = nonNullVals.length ? Math.min(...nonNullVals) : 0
  const barColors = buildBarColors(sorted)

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1.1rem 1.25rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em" }}>
            EBI vs Baselines
          </div>
        </div>
        {/* Metric dropdown */}
        <select
          value={metric}
          onChange={e => setMetric(e.target.value as MetricKey)}
          style={{
            fontSize: 12, padding: "4px 8px", borderRadius: 8, border: ".5px solid #d2d2d7",
            background: "#f5f5f7", color: "#1d1d1f", cursor: "pointer", outline: "none", width: "auto",
          }}
        >
          {METRIC_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label} {o.direction}</option>
          ))}
        </select>
      </div>

      {/* Legend — deduplicated by label */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        {Array.from(new Map(Object.values(TYPE_BADGE).map(b => [b.label, b])).values()).map(b => (
          <span key={b.label} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: b.bg, color: b.text, fontWeight: 600 }}>
            {b.label}
          </span>
        ))}
      </div>

      {/* Bars */}
      <div style={{ position: "relative" }}>
        {sorted.map((row, i) => {
          const rawVal = row[metric]
          const val = rawVal as number | null
          const badge = badgeFor(row.type)
          const fillColor = barColors[i]
          const hasDiverge = minVal < 0  // true in ρ mode for this domain

          let barEl: React.ReactNode
          if (val === null || val === undefined) {
            const nullLabel = metric === "spearman_rho" ? "constant output" : "—"
            barEl = (
              <div style={{ flex: 1, background: "#f5f5f7", borderRadius: 100, height: 14, position: "relative" }}>
                <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", fontSize: 9, color: "#b0b0b8", fontStyle: "italic", whiteSpace: "nowrap" }}>{nullLabel}</span>
              </div>
            )
          } else if (hasDiverge) {
            const extreme = Math.max(Math.abs(minVal), Math.abs(maxVal))
            const halfPct = extreme > 0 ? (Math.abs(val) / extreme) * 50 : 0
            const isNeg = val < 0
            // label position: inside bar at inner edge; white if bar wide enough, gray otherwise
            const labelLeft = isNeg ? `${50 - halfPct + 2}%` : `${50 + halfPct - 2}%`
            const labelAnchor = isNeg ? "left" : "right"
            barEl = (
              <div style={{ flex: 1, background: "#f5f5f7", borderRadius: 100, height: 14, cursor: "pointer", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltip({ label: `${modelLabel(row.model)} (${badge.label})`, value: val, x: rect.left + rect.width / 2, y: rect.top - 8 }) }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: "rgba(0,0,0,0.15)", zIndex: 1 }} />
                <div style={{
                  position: "absolute",
                  left: isNeg ? `${50 - halfPct}%` : "50%",
                  width: `${halfPct}%`, height: "100%",
                  background: isNeg ? "#d1d5db" : fillColor,
                  borderRadius: 100,
                  transition: "width .4s cubic-bezier(.25,.46,.45,.94), left .4s cubic-bezier(.25,.46,.45,.94)",
                }} />
                {halfPct > 12 && (
                  <span style={{
                    position: "absolute",
                    [labelAnchor]: `calc(100% - ${50 + halfPct - 2}%)`,
                    ...(isNeg ? { left: `${50 - halfPct + 2}%` } : { right: `calc(100% - ${50 + halfPct - 2}%)` }),
                    top: "50%", transform: "translateY(-50%)",
                    fontSize: 9, fontWeight: 700,
                    color: "#fff",
                    pointerEvents: "none", zIndex: 2,
                  }}>
                    {val.toFixed(3)}
                  </span>
                )}
              </div>
            )
          } else {
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
            barEl = (
              <div style={{ flex: 1, background: "#f5f5f7", borderRadius: 100, height: 14, cursor: "pointer", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTooltip({ label: `${modelLabel(row.model)} (${badge.label})`, value: val, x: rect.left + rect.width / 2, y: rect.top - 8 }) }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div style={{ width: `${pct}%`, height: "100%", background: fillColor, borderRadius: 100, position: "relative", transition: "width .4s cubic-bezier(.25,.46,.45,.94)" }}>
                  {pct > 12 && (
                    <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                      {val.toFixed(3)}
                    </span>
                  )}
                </div>
                {pct <= 12 && (
                  <span style={{ position: "absolute", left: `calc(${pct}% + 6px)`, top: "50%", transform: "translateY(-50%)", fontSize: 9, fontWeight: 700, color: "#6e6e73" }}>{val.toFixed(3)}</span>
                )}
              </div>
            )
          }
          return (
            <div key={`${row.type}-${row.model}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ fontSize: 10, color: "#6e6e73", width: 70, textAlign: "right", flexShrink: 0 }}>
                {modelLabel(row.model)}
              </div>
              {barEl}
              <span style={{
                fontSize: 9, padding: "2px 0", borderRadius: 100,
                background: badge.bg, color: badge.text, fontWeight: 600, flexShrink: 0,
                minWidth: 42, textAlign: "center", display: "inline-block",
              }}>
                {badge.label}
              </span>
            </div>
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "fixed", left: tooltip.x, top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "#1d1d1f", color: "#fff", fontSize: 11, padding: "5px 10px",
            borderRadius: 8, pointerEvents: "none", zIndex: 999, whiteSpace: "nowrap",
          }}>
            {tooltip.label}: <strong>{tooltip.value.toFixed(4)}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
