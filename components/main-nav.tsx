"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutGrid } from "lucide-react"
import { DOMAINS } from "@/lib/domain-config"

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
      <div className="flex items-center justify-between md:justify-start gap-6">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary shrink-0",
            pathname === "/" ? "text-primary" : "text-muted-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>EBI Framework</span>
        </Link>

        <span className="text-xs text-muted-foreground hidden sm:block md:hidden">
          EMNLP Demo 2026
        </span>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        {DOMAINS.map(domain => (
          <Link
            key={domain.slug}
            href={`/domain/${domain.slug}`}
            className={cn(
              "text-sm transition-colors hover:text-primary shrink-0",
              pathname === `/domain/${domain.slug}`
                ? "text-primary font-medium"
                : "text-muted-foreground"
            )}
          >
            {domain.shortTitle}
          </Link>
        ))}
      </div>

      <span className="text-xs text-muted-foreground hidden md:block">
        EMNLP Demo 2026
      </span>
    </nav>
  )
}
