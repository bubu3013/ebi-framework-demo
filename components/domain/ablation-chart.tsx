"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts"
import type { AblationData } from "@/lib/domain-config"

interface AblationChartProps {
  ablation: AblationData
  domainKey: string
}

const CONDITIONS = [
  { key: "none",    label: "None"    },
  { key: "E_only",  label: "E only"  },
  { key: "B_only",  label: "B only"  },
  { key: "EB_full", label: "EB full" },
] as const

const BAR_COLORS = {
  none:    "#e5e5ea",
  E_only:  "#f59e0b",
  B_only:  "#34d399",
  EB_full: "#0071e3",
}

function MiniBar({ data, label, direction }: {
  data: { condition: string; value: number | null; key: string }[]
  label: string
  direction: "↑" | "↓"
}) {
  return (
    <div style={{ background: "var(--color-background-secondary, #f5f5f7)", borderRadius: 12, padding: ".75rem .9rem", height: "100%", display: "flex", flexDirection: "column" }}>
      <p style={{ fontSize: 12, fontWeight: 500, color: "#1d1d1f", marginBottom: 8 }}>
        {label} <span style={{ color: "#0071e3" }}>{direction}</span>
      </p>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 20, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" vertical={false} />
            <XAxis dataKey="condition" tick={{ fontSize: 11, fill: "#86868b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#86868b" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "#fff", border: "0.5px solid #d2d2d7", borderRadius: 8, fontSize: 12 }}
              formatter={(v: unknown) => typeof v === "number" ? [v.toFixed(4), label] : "—"}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {data.map((d) => (
                <Cell key={d.key} fill={BAR_COLORS[d.key as keyof typeof BAR_COLORS] ?? "#a0aec0"} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                fontSize={10}
                fill="#6e6e73"
                formatter={(v: unknown) => typeof v === "number" ? v.toFixed(3) : ""}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function AblationChart({ ablation, domainKey }: AblationChartProps) {
  const rhoRow = ablation.rho.find(r => r.domain === domainKey)
  const jsdRow = ablation.jsd.find(r => r.domain === domainKey)
  const maeRow = ablation.mae?.find(r => r.domain === domainKey)

  if (!rhoRow && !jsdRow) return null

  const mkData = (row: typeof rhoRow) =>
    CONDITIONS.map(({ key, label }) => ({
      condition: label,
      value: row?.[key] ?? null,
      key,
    }))

  return (
    <div style={{ background: "#fff", border: ".5px solid #e5e5ea", borderRadius: 16, padding: "1rem 1.1rem" }}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#1d1d1f", letterSpacing: "-.02em", marginBottom: "1rem" }}>
        Ablation Study
      </p>
      <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "stretch" }}>
        <MiniBar data={mkData(jsdRow)} label="JSD" direction="↓" />
        <MiniBar data={mkData(rhoRow)} label="Spearman ρ" direction="↑" />
        <MiniBar data={mkData(maeRow)} label="MAE" direction="↓" />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: ".75rem", flexWrap: "wrap" }}>
        {[["#e5e5ea", "None"], ["#f59e0b", "E only"], ["#34d399", "B only"], ["#0071e3", "EB full"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
            <span style={{ fontSize: 10, color: "#86868b" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
