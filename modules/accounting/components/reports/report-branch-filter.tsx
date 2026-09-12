"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback } from "react"

interface Branch {
  id: string
  name: string
}

interface ReportBranchFilterProps {
  branches: Branch[]
  selectedBranchId?: string
}

export function ReportBranchFilter({ branches, selectedBranchId }: ReportBranchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleBranchChange = useCallback(
    (branchId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (branchId && branchId !== "all") {
        params.set("branchId", branchId)
      } else {
        params.delete("branchId")
      }
      
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Cabang:</span>
      <Select
        value={selectedBranchId || "all"}
        onValueChange={handleBranchChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Semua Cabang" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Cabang</SelectItem>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
