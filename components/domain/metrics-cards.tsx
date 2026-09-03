"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { ResultRow } from "@/lib/domain-config"

interface MetricsCardsProps {
  rows: ResultRow[]
  selectedModel: string
}

function fmt(val: number | null, decimals: number): string {
  if (val === null || val === undefined) return "—"
  return val.toFixed(decimals)
}

export function MetricsCards({ rows, selectedModel }: MetricsCardsProps) {
  const row = rows.find(r => r.type === "ebi" && r.model === selectedModel)

  const metrics = [
    {
      label: "JSD ↓",
      value: fmt(row?.jsd ?? null, 4),
      desc: "Jensen–Shannon Divergence",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Spearman ρ ↑",
      value: fmt(row?.spearman_rho ?? null, 4),
      desc: "Rank correlation with ground truth",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "MAE ↓",
      value: fmt(row?.mae ?? null, 4),
      desc: row?.mae_scale ?? "Mean Absolute Error",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map(({ label, value, desc, color, bg }) => (
        <Card key={label} className="border-border">
          <CardContent className="pt-6">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
              <span className={`text-xs font-semibold ${color}`}>{label}</span>
            </div>
            <p className="text-3xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
