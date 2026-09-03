import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"

export interface ElectionJPFeatures {
  prediction_month: string
  q1_approve: string
  q1_disapprove: string
  q7_ruling: string
  q7_balanced: string
  q7_opposition: string
  q8_approve: string
  q8_disapprove: string
  q9_expect: string
  q9_not_expect: string
  q10_issue: string
  q10_pct: string
  q11_stance: string
  q2_ldp: string
  q2_cra: string
  q2_dpfp: string
  q2_ishin: string
  q2_sanseito: string
  q2_teammirai: string
  q2_other: string
  q4_interested: string
}

const ATTRIBUTION_KEYS = ["q1", "q7", "q8", "q9", "q10", "q11", "q2", "q4"] as const

const SYS = `あなたは日本の選挙アナリストです。
提供された世論調査データと政治的文脈をもとに、2026年2月8日衆議院選挙の比例代表得票率を予測してください。

出力形式 — 以下の2部構成のみ、他の説明・コメントは一切不要：

第1部（7行、この順序で）：
自民党=XX.X
中道改革連合=XX.X
国民民主党=XX.X
日本維新の会=XX.X
参政党=XX.X
チームみらい=XX.X
その他=XX.X
（各値は小数点第1位まで、合計が必ず100.0になるよう調整すること）

第2部（${ATTRIBUTION_KEYS.length}行、この順序で: ${ATTRIBUTION_KEYS.join(", ")}）：
形式：<key>: <positive|negative|neutral> — <20語以内の一文（英語）>
理由は具体的な数値や閾値比較を引用した分析的判断であること。「値が上がったので正の影響」のような定型文は禁止。`

function buildUserMsg(f: ElectionJPFeatures): string {
  const q2Other = parseFloat(f.q2_other)
  const q2OtherStr = isNaN(q2Other) ? f.q2_other : q2Other.toFixed(1)

  const lines: string[] = [
    "【政治的文脈（[E]）】",
    `■ 内閣支持率（Q1）：支持する ${f.q1_approve}%、支持しない ${f.q1_disapprove}%`,
    `■ 希望する選挙結果（Q7）：与党優勢 ${f.q7_ruling}%、拮抗 ${f.q7_balanced}%、野党優勢 ${f.q7_opposition}%`,
    `■ 衆院解散への賛否（Q8）：賛成 ${f.q8_approve}%、反対 ${f.q8_disapprove}%`,
    `■ 中道改革連合（新党）への期待（Q9）：期待する ${f.q9_expect}%、期待しない ${f.q9_not_expect}%`,
    `■ 最重視政策・上位（Q10・複数回答）：${f.q10_issue}（${f.q10_pct}%）`,
    `■ 消費税スタンス（Q11）：${f.q11_stance}`,
    "■ 新興政党について（参考）：参政党はSNS・草の根運動を戦略的に活用し保守層・無党派層を動員する新興政党；" +
      "チームみらいはAIエンジニア・安野貴博が率いるデジタル民主主義・成長投資を掲げる新興政党。" +
      "両党の過去データはN/Aだが、これは得票ゼロを意味しない——存在し支持基盤を持つ政党である。",
    "",
    "【行動統計（[B]｜共同通信第1回世論調査 2026/1/24〜25）】",
    "■ 政党支持分布（Q2）：",
    `  自民：${f.q2_ldp}%`,
    `  中道：${f.q2_cra}%`,
    `  国民：${f.q2_dpfp}%`,
    `  維新：${f.q2_ishin}%`,
    `  参政：${f.q2_sanseito}%`,
    `  みらい：${f.q2_teammirai}%`,
    `  その他政党・支持政党なし・分からない：${q2OtherStr}%`,
    `■ 衆院選への関心度（Q4）：関心あり計 ${f.q4_interested}%`,
    "",
    "【予測タスク（[I]）】",
    "2026年2月8日衆議院選挙の比例代表得票率を予測してください。",
    "対象：以下の7カテゴリ（主要6党＋その他）",
    "  自民党 / 中道改革連合 / 国民民主党 / 日本維新の会 / 参政党 / チームみらい / その他",
    "",
    "注意：「その他」には上記6党以外の全政党・政治団体の得票を含めること。",
  ]
  return lines.join("\n")
}

export async function predictWithOpenAI(features: ElectionJPFeatures, apiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey })
  const response = await client.chat.completions.create({
    model: "gpt-4.1-2025-04-14",
    temperature: 0,
    messages: [
      { role: "system", content: SYS },
      { role: "user", content: buildUserMsg(features) },
    ],
  })
  return response.choices[0]?.message?.content?.trim() ?? ""
}

export async function predictWithClaude(features: ElectionJPFeatures, apiKey: string, model: string): Promise<string> {
  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model,
    max_tokens: 500,
    temperature: 0,
    system: SYS,
    messages: [{ role: "user", content: buildUserMsg(features) }],
  })
  const block = response.content[0]
  return block.type === "text" ? block.text.trim() : ""
}
