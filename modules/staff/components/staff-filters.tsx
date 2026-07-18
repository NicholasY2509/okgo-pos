"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface StaffFiltersProps {
  branches: any[]
}

export function StaffFilters({ branches }: StaffFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get("search")?.toString() || ""
  const currentBranch = searchParams.get("branchId")?.toString() || "all"

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debouncedSearchValue = useDebounce(searchValue, 500)

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.set("page", "1")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Update URL when debounced search value changes
  useEffect(() => {
    if (debouncedSearchValue !== currentSearch) {
      updateFilter("search", debouncedSearchValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue])

  // Sync external changes (like clear button) to local state
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  const clearFilters = () => {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.delete("branchId")
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
      <div className="relative w-full sm:w-[300px]">
        <Input
          placeholder="Cari staf..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="w-full sm:w-[200px]">
        <Select
          value={currentBranch}
          onValueChange={(val) => updateFilter("branchId", val)}
        >
          <SelectTrigger>
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

      {(currentSearch || currentBranch !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
        >
          <X className="h-4 w-4 mr-2" />
          Hapus Filter
        </Button>
      )}

      {isPending && (
        <div className="text-sm text-muted-foreground ml-auto animate-pulse">
          Memuat...
        </div>
      )}
    </div>
  )
}
