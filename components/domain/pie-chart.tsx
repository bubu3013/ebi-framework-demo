"use client"

import { useState } from "react"

interface Segment {
  value: number
  color: string
  label: string
}

interface PieChartProps {
  segments: Segment[]
  size?: number
  title?: string
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function donutPath(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  const o1 = polarToXY(cx, cy, outerR, startDeg)
  const o2 = polarToXY(cx, cy, outerR, endDeg)
  const i1 = polarToXY(cx, cy, innerR, endDeg)
  const i2 = polarToXY(cx, cy, innerR, startDeg)
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ")
}

export function PieChart({ segments, size = 120, title }: PieChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  const cx = 50, cy = 50, outerR = 42, innerR = 25
  let cursor = 0

  const paths = segments.map((seg, i) => {
    const sweep = (seg.value / total) * 360
    const start = cursor
    const end = cursor + sweep - 0.4
    cursor += sweep
    return { ...seg, path: donutPath(cx, cy, outerR, innerR, start, end), i }
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 0, width: "100%" }}>
      {title && (
        <div style={{ fontSize: 12, color: "#86868b", textTransform: "uppercase", letterSpacing: ".04em", textAlign: "center" }}>{title}</div>
      )}
      <div style={{ position: "relative", maxWidth: size, width: "100%" }}>
        <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", width: "100%", height: "auto", maxWidth: size, display: "block" }}>
          {paths.map(p => (
            <path
              key={p.i}
              d={p.path}
              fill={p.color}
              opacity={hovered === null || hovered === p.i ? 1 : 0.4}
              style={{ cursor: "pointer", transition: "opacity .15s" }}
              onMouseEnter={() => setHovered(p.i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {hovered !== null && (
            <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d1d1f">
              {segments[hovered].value.toFixed(1)}%
            </text>
          )}
          {hovered !== null && (
            <text x="50" y="59" textAnchor="middle" fontSize="7" fill="#86868b">
              {segments[hovered].label.length > 8 ? segments[hovered].label.slice(0, 8) + "…" : segments[hovered].label}
            </text>
          )}
        </svg>
      </div>
      {/* Legend — 15px body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 6, opacity: hovered === null || hovered === i ? 1 : 0.4, transition: "opacity .15s", cursor: "default" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 15, color: "#86868b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {seg.label}
            </span>
            <span style={{ fontSize: 15, color: "#4b5563", fontWeight: 500 }}>
              {seg.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
