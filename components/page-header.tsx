import React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  children,
  backHref,
  backLabel,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="space-y-1">
        {backHref && (
          <div className="mb-1">
            <Link
              href={backHref}
              className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1 transition-transform group-hover:-translate-x-0.5" />
              <span>{backLabel || "Kembali"}</span>
            </Link>
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}

