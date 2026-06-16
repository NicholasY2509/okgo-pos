import React from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card"

interface PageHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <Card className="flex flex-row flex-1 justify-between items-center">
      <CardHeader className="flex-1">
        <CardTitle className="text-3xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card >
  )
}
