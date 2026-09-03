"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { ResultRow } from "@/lib/domain-config"

interface ResultsTableProps {
  rows: ResultRow[]
}

const TYPE_LABEL: Record<string, string> = {
  ebi: "EBI",
  baseline_statistical: "Statistical",
  statistical: "Statistical",
  baseline_ml: "ML",
  ml: "ML",
  baseline_sota: "SOTA",
  sota: "SOTA",
  baseline_reference: "Reference",
  reference: "Reference",
}

const TYPE_ORDER = ["ebi", "baseline_statistical", "statistical", "baseline_ml", "ml", "baseline_sota", "sota", "baseline_reference", "reference"]

const MODEL_LABEL: Record<string, string> = {
  "gpt-4.1-2025-04-14": "GPT-4.1",
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
  "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5",
  ols: "OLS", OLS: "OLS",
  sarima: "SARIMA", SARIMA: "SARIMA",
  xgboost: "XGBoost", XGBoost: "XGBoost",
  lstm: "LSTM", LSTM: "LSTM",
  lstprompt: "LSTPrompt", LSTPrompt: "LSTPrompt",
  survey: "Survey (reference)",
}

function fmtNum(val: number | null, decimals: number): string {
  if (val === null || val === undefined) return "—"
  return val.toFixed(decimals)
}

function findBest(rows: ResultRow[], key: keyof ResultRow, direction: "min" | "max"): number | null {
  const vals = rows.map(r => r[key] as number | null).filter(v => v !== null) as number[]
  if (!vals.length) return null
  return direction === "min" ? Math.min(...vals) : Math.max(...vals)
}

export function ResultsTable({ rows }: ResultsTableProps) {
  const bestJsd = findBest(rows, "jsd", "min")
  const bestRho = findBest(rows, "spearman_rho", "max")
  const bestMae = findBest(rows, "mae", "min")

  const sorted = [...rows].sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a.type)
    const bi = TYPE_ORDER.indexOf(b.type)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  let lastType = ""

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Results — EBI vs Baselines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">JSD ↓</TableHead>
                <TableHead className="text-right">ρ ↑</TableHead>
                <TableHead className="text-right">MAE ↓</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, i) => {
                const typeLabel = TYPE_LABEL[row.type] ?? row.type
                const showType = typeLabel !== lastType
                if (showType) lastType = typeLabel

                const jsdBold = row.jsd !== null && row.jsd === bestJsd
                const rhoBold = row.spearman_rho !== null && row.spearman_rho === bestRho
                const maeBold = row.mae !== null && row.mae === bestMae

                return (
                  <TableRow key={i} className="hover:bg-secondary/20">
                    <TableCell className="text-muted-foreground text-sm">
                      {showType ? (
                        <span className="font-medium text-foreground">{typeLabel}</span>
                      ) : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      {MODEL_LABEL[row.model] ?? row.model}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${jsdBold ? "font-bold text-primary" : ""}`}>
                      {fmtNum(row.jsd, 4)}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${rhoBold ? "font-bold text-primary" : ""}`}>
                      {fmtNum(row.spearman_rho, 4)}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-sm ${maeBold ? "font-bold text-primary" : ""}`}>
                      {fmtNum(row.mae, 4)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Bold = best value per column across all methods.</p>
      </CardContent>
    </Card>
  )
}
