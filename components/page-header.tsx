import React from "react"

interface PageHeaderProps {
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-row flex-1 justify-between items-center">
      <div className="flex-1 space-y-0.5d">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-smd text-muted-foreground">{description}</p>}
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}
