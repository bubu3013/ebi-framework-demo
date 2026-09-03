'use client'

import { use, useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { getDomainConfig, MODELS } from '@/lib/domain-config'
import type { ResultData, AblationData, ModelId } from '@/lib/domain-config'
import { MetricsCards } from '@/components/domain/metrics-cards'
import { ModelChart } from '@/components/domain/model-chart'
import { PredGtChart } from '@/components/domain/pred-gt-chart'
import { AblationChart } from '@/components/domain/ablation-chart'
import { AblationGuessIt } from '@/components/domain/ablation-guess-it'
import { AblationBuilder } from '@/components/domain/ablation-builder'
import { UploadPredict } from '@/components/domain/upload-predict'
import { TryItYourselfElectionJp } from '@/components/domain/try-it-yourself-election-jp'
import { TryItYourselfKickstarter } from '@/components/domain/try-it-yourself-kickstarter'

interface Props {
  params: Promise<{ slug: string }>
}

export default function DomainPage({ params }: Props) {
  const { slug } = use(params)
  const domain = getDomainConfig(slug)
  if (!domain) notFound()

  const [model, setModel] = useState<ModelId>('gpt-4.1-2025-04-14')
  const [results, setResults] = useState<ResultData | null>(null)
  const [ablation, setAblation] = useState<AblationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(domain.resultJsonPath).then(r => r.json()),
      fetch('/data/ablation.json').then(r => r.json()),
    ]).then(([res, abl]) => {
      setResults(res)
      setAblation(abl)
      setLoading(false)
    })
  }, [domain.resultJsonPath])

  return (
    <main style={{
      padding: "2rem 2.5rem",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      background: "#ffffff", minHeight: "100vh",
    }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.03em", color: "#1d1d1f", margin: 0 }}>
            {domain.shortTitle}
          </h1>
          <p style={{ fontSize: 13, color: "#86868b", marginTop: 4 }}>
            {domain.metricUnit}
          </p>
        </div>
        {/* Model dropdown */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase", color: "#86868b" }}>
            Model
          </span>
          <select
            value={model}
            onChange={e => setModel(e.target.value as ModelId)}
            style={{
              fontSize: 13, padding: "7px 12px", borderRadius: 10, border: ".5px solid #d2d2d7",
              background: "#f5f5f7", color: "#1d1d1f", cursor: "pointer", outline: "none",
            }}
          >
            {MODELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "6rem 0", textAlign: "center", color: "#86868b", fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Metric cards */}
          {results && (
            <MetricsCards rows={results.rows} selectedModel={model} />
          )}

          {/* Pred vs GT + EBI vs Baselines — side by side */}
          <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "55fr 45fr", gap: 12 }}>
            {results?.breakdown && (
              <PredGtChart breakdown={results.breakdown} selectedModel={model} />
            )}
            {results && <ModelChart rows={results.rows} selectedModel={model} />}
          </div>

          {/* Ablation chart — hidden for now
          {ablation && (
            <AblationChart
              ablation={ablation}
              domainKey={domain.ablationDomainKey}
            />
          )} */}

          {/* Interactive ablation — election-jp */}
          {slug === 'election-jp' && results && (results as any).guess_it && (
            <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <AblationGuessIt
                parties={(results as any).parties}
                fullEbi={(results as any).full_ebi}
                features={(results as any).guess_it}
              />
              <AblationBuilder
                parties={(results as any).parties}
                builder={(results as any).builder}
              />
            </div>
          )}

          {/* Interactive ablation — kickstarter-technology */}
          {slug === 'kickstarter-technology' && results && (results as any).guess_it && (() => {
            const ksMonths = ['Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026']
            const builder = (results as any).builder ?? {}
            const guessIt = (results as any).guess_it ?? []
            const gtMonthly = (results as any).breakdown?.gt_monthly ?? {}
            const allVals: number[] = [
              ...Object.values(builder).flatMap((c: any) => Object.values(c.monthly ?? {}) as number[]),
              ...guessIt.flatMap((f: any) => Object.values(f.monthly ?? {}) as number[]),
              ...(Object.values(gtMonthly) as number[]),
            ]
            const dataMin = allVals.length ? Math.min(...allVals) : 0.75
            const dataMax = allVals.length ? Math.max(...allVals) : 0.95
            const ksYDomain: [number, number] = [
              Math.max(0, Math.floor((dataMin - 0.02) * 20) / 20),
              Math.min(1, Math.ceil((dataMax + 0.02) * 20) / 20),
            ]
            return (
              <div className="ebi-stack-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <AblationGuessIt
                    parties={(results as any).parties}
                    fullEbi={(results as any).full_ebi}
                    features={guessIt}
                    chartType="line"
                    fullEbiMonthly={builder?.full?.monthly}
                    gtMonthly={gtMonthly}
                    months={ksMonths}
                    valueMode="percent"
                    yDomain={ksYDomain}
                  />
                </div>
                <div style={{ minWidth: 0 }}>
                  <AblationBuilder
                    parties={(results as any).parties}
                    builder={builder}
                    chartType="line"
                    gtMonthly={gtMonthly}
                    months={ksMonths}
                    valueMode="percent"
                    yDomain={ksYDomain}
                  />
                </div>
              </div>
            )
          })()}

          {/* Try it yourself / Upload & Predict */}
          {slug === 'election-jp' ? <TryItYourselfElectionJp />
            : slug === 'kickstarter-technology' ? <TryItYourselfKickstarter />
            : <UploadPredict domain={domain} />}
        </div>
      )}
    </main>
  )
}
