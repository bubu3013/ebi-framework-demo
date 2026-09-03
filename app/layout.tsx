import React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"

const _geist     = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EBI Framework — Interactive Demo",
  description: "Can LLMs approximate collective behavior? The Exogenous–Behavioral–Inference framework predicts population-level outcomes across markets, elections, and crowdfunding.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
