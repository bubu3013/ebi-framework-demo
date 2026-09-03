"use client"

import { usePathname } from "next/navigation"
import { MainNav } from "@/components/main-nav"

export function SiteHeader() {
  const pathname = usePathname()
  if (pathname === "/") return null

  return (
    <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 py-4">
        <MainNav />
      </div>
    </header>
  )
}
