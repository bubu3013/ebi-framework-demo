"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Loader2 } from "lucide-react"
import type { DomainConfig, ModelId } from "@/lib/domain-config"
import { MODELS } from "@/lib/domain-config"
import Papa from "papaparse"

interface UploadPredictProps {
  domain: DomainConfig
}

export function UploadPredict({ domain }: UploadPredictProps) {
  const [model, setModel] = useState<ModelId>("gpt-4.1-2025-04-14")
  const [apiKey, setApiKey] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    if (!file || !apiKey.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
      const rows = (parsed.data as Record<string, string>[]).filter(
        r => !Object.keys(r)[0]?.startsWith("#")
      )

      const res = await fetch(domain.apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: rows, model, apiKey: apiKey.trim() }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Request failed")
      setResult(JSON.stringify(json.prediction, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">Upload & Predict</CardTitle>
        <p className="text-sm text-muted-foreground">
          Run live inference with your own API key and data.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Download template */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
          <Download className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Template CSV</p>
            <p className="text-xs text-muted-foreground">
              Please follow the template provided in CSV. Each row = one prediction unit.
            </p>
          </div>
          <a href={domain.templateCsvPath} download>
            <Button variant="outline" size="sm">Download</Button>
          </a>
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Upload CSV</label>
          <div
            className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select CSV file"}
            </span>
            {file && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {(file.size / 1024).toFixed(1)} KB
              </Badge>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* API key */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">API Key</label>
          <Input
            type="password"
            placeholder="sk-... or sk-ant-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your key is sent directly to the model provider and never stored.
          </p>
        </div>

        {/* Model selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Model</label>
          <div className="flex flex-wrap gap-2">
            {MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => setModel(m.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  model === m.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!file || !apiKey.trim() || loading}
          className="w-full"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running prediction...</>
          ) : (
            "Run Prediction"
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-primary">Prediction Result</p>
            <pre className="p-4 rounded-lg bg-secondary text-sm font-mono overflow-x-auto whitespace-pre-wrap border border-border">
              {result}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
