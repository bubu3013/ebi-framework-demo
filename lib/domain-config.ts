export type DomainSlug =
  | 'election-jp'
  | 'kickstarter-technology'

export interface DomainConfig {
  slug: DomainSlug
  title: string
  shortTitle: string
  country: string
  description: string
  metricUnit: string
  resultJsonPath: string
  templateCsvPath: string
  apiRoute: string
}

export const DOMAINS: DomainConfig[] = [
  {
    slug: 'election-jp',
    title: 'Japan 2026 Election',
    shortTitle: 'Japan 2026 General Election',
    country: 'Japan',
    description: '7-party vote share prediction for Japan House of Representatives.',
    metricUnit: 'Vote share (7 parties)',
    resultJsonPath: '/data/results/election-jp.json',
    templateCsvPath: '/templates/template-election-jp.csv',
    apiRoute: '/api/election-jp-predict',
  },
  {
    slug: 'kickstarter-technology',
    title: 'Kickstarter Technology',
    shortTitle: 'US Kickstarter Technology',
    country: 'United States',
    description: 'Monthly campaign success rate prediction for Kickstarter Technology category.',
    metricUnit: 'Success rate (proportion)',
    resultJsonPath: '/data/results/kickstarter-technology.json',
    templateCsvPath: '/templates/template-kickstarter-technology.csv',
    apiRoute: '/api/kickstarter-technology-predict',
  },
]

export function getDomainConfig(slug: string): DomainConfig | undefined {
  return DOMAINS.find(d => d.slug === slug)
}

export type ModelId =
  | 'gpt-4.1-2025-04-14'
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-5-20250929'

export const MODELS: { value: ModelId; label: string }[] = [
  { value: 'gpt-4.1-2025-04-14',        label: 'GPT-4.1' },
  { value: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
]

export interface ResultRow {
  type: string
  model: string
  jsd: number | null
  spearman_rho: number | null
  mae: number | null
  mae_scale: string
}

export interface BreakdownData {
  type: "distribution" | "class_probability" | "category_rate" | "success_rate_monthly"
  unit: "party" | "class" | "category"
  labels: string[]
  gt: number[]
  predictions: Record<string, number[]>
}

export interface ResultData {
  domain: string
  rows: ResultRow[]
  breakdown?: BreakdownData
}
