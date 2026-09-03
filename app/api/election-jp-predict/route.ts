import { NextResponse } from "next/server"
import { predictWithOpenAI, predictWithClaude } from "@/lib/election-jp-llm"
import type { ElectionJPFeatures } from "@/lib/election-jp-llm"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { features, model } = body
    const isOpenAI = model === "gpt-4.1-2025-04-14"
    const apiKey = body.apiKey

    if (!features || !Array.isArray(features) || features.length === 0)
      return NextResponse.json({ error: "features array is required" }, { status: 400 })
    if (!apiKey)
      return NextResponse.json({ error: "apiKey is required" }, { status: 400 })
    if (!model)
      return NextResponse.json({ error: "model is required" }, { status: 400 })

    const row = features[0] as ElectionJPFeatures
    let raw: string

    if (isOpenAI) {
      raw = await predictWithOpenAI(row, apiKey)
    } else {
      raw = await predictWithClaude(row, apiKey, model)
    }

    return NextResponse.json({ prediction: { raw } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
