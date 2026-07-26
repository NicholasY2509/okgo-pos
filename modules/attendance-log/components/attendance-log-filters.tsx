"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"

const ATTENDANCE_STATES = [
  { value: "0", label: "Tidak Dikenal" },
  { value: "1", label: "Masuk" },
  { value: "2", label: "Mulai Istirahat" },
  { value: "3", label: "Selesai Istirahat" },
  { value: "4", label: "Pulang" },
  { value: "5", label: "Mulai Lembur" },
  { value: "6", label: "Selesai Lembur" },
]

interface AttendanceLogFiltersProps {
  branches: { id: string; name: string }[]
}

export function AttendanceLogFilters({ branches }: AttendanceLogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 500)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      params.delete("page") // Reset to page 1 on filter change
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    if (debouncedSearch !== (searchParams.get("search") || "")) {
      router.push(`?${createQueryString("search", debouncedSearch)}`)
    }
  }, [debouncedSearch, createQueryString, router, searchParams])

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama staf atau SN mesin..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => setSearch("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Select
          value={searchParams.get("branchId") || "all"}
          onValueChange={(value) => {
            router.push(`?${createQueryString("branchId", value === "all" ? "" : value)}`)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
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

        <Select
          value={searchParams.get("state") || "all"}
          onValueChange={(value) => {
            router.push(`?${createQueryString("state", value === "all" ? "" : value)}`)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {ATTENDANCE_STATES.map((state) => (
              <SelectItem key={state.value} value={state.value}>
                {state.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
