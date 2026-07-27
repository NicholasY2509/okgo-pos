"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
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

import { DatePickerWithRange } from "@/components/ui/date-picker-with-range"
import { DateRange } from "react-day-picker"

interface AttendanceFiltersProps {
  statuses: { id: string; name: string }[]
}

export function AttendanceFilters({ statuses }: AttendanceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const debouncedSearch = useDebounce(search, 500)

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined,
    to: searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined,
  })

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

  const createMultiQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })
      params.delete("page")
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
          placeholder="Cari nama staf..."
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
        <div className="w-full sm:w-[250px]">
          <DatePickerWithRange
            date={dateRange}
            setDate={(newDateRange) => {
              setDateRange(newDateRange)

              let fromStr = undefined;
              let toStr = undefined;

              if (newDateRange?.from) {
                // Adjust to local date string to avoid UTC offset issues in URL
                const fromDate = new Date(newDateRange.from);
                fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
                fromStr = fromDate.toISOString().split('T')[0];
              }

              if (newDateRange?.to) {
                const toDate = new Date(newDateRange.to);
                toDate.setMinutes(toDate.getMinutes() - toDate.getTimezoneOffset());
                toStr = toDate.toISOString().split('T')[0];
              }

              router.push(`?${createMultiQueryString({
                startDate: fromStr,
                endDate: toStr
              })}`)
            }}
          />
        </div>

        <Select
          value={searchParams.get("statusId") || "all"}
          onValueChange={(value) => {
            router.push(`?${createQueryString("statusId", value === "all" ? "" : value)}`)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
