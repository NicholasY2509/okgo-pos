"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { MonthPicker } from "@/components/ui/month-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

export interface BranchFilterOption {
  id: string
  name: string
}

interface JournalFiltersProps {
  branches?: BranchFilterOption[]
}

export function JournalFilters({ branches }: JournalFiltersProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStartDate = searchParams.get("startDate")
  const currentEndDate = searchParams.get("endDate")
  const currentBranchId = searchParams.get("branchId")
  const currentMonthParam = searchParams.get("month")

  const [startDate, setStartDate] = useState<Date | undefined>(
    currentStartDate ? new Date(currentStartDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    currentEndDate ? new Date(currentEndDate) : undefined
  )

  // Keep state in sync with URL
  useEffect(() => {
    setStartDate(currentStartDate ? new Date(currentStartDate) : undefined)
    setEndDate(currentEndDate ? new Date(currentEndDate) : undefined)
  }, [currentStartDate, currentEndDate])

  const handleMonthSelect = (val: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!val) {
      params.delete("month")
      params.delete("startDate")
      params.delete("endDate")
      setStartDate(undefined)
      setEndDate(undefined)
    } else {
      const [y, m] = val.split("-").map(Number)
      const mStart = new Date(y, m - 1, 1, 0, 0, 0, 0)
      const mEnd = new Date(y, m, 0, 23, 59, 59, 999)
      params.set("month", val)
      params.set("startDate", mStart.toISOString())
      params.set("endDate", mEnd.toISOString())
      setStartDate(mStart)
      setEndDate(mEnd)
    }
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const applyCustomDateFilters = (newStart?: Date, newEnd?: Date) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newStart) {
      params.set("startDate", newStart.toISOString())
    } else {
      params.delete("startDate")
    }

    if (newEnd) {
      params.set("endDate", newEnd.toISOString())
    } else {
      params.delete("endDate")
    }

    // Check if newStart and newEnd match an exact month
    if (newStart && newEnd) {
      const startStr = format(newStart, "yyyy-MM")
      const endStr = format(newEnd, "yyyy-MM")
      const lastDayOfStartMonth = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0).getDate()
      if (startStr === endStr && newStart.getDate() === 1 && newEnd.getDate() === lastDayOfStartMonth) {
        params.set("month", startStr)
      } else {
        params.delete("month")
      }
    } else {
      params.delete("month")
    }

    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleStartDateChange = (date?: Date) => {
    setStartDate(date)
    applyCustomDateFilters(date, endDate)
  }

  const handleEndDateChange = (date?: Date) => {
    setEndDate(date)
    applyCustomDateFilters(startDate, date)
  }

  const handleBranchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set("branchId", value)
    } else {
      params.delete("branchId")
    }
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("startDate")
    params.delete("endDate")
    params.delete("month")
    params.delete("branchId")
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const hasActiveFilters = Boolean(
    currentStartDate ||
    currentEndDate ||
    currentMonthParam ||
    (currentBranchId && currentBranchId !== "all")
  )

  const activeMonthValue = currentMonthParam || (startDate && endDate && format(startDate, "yyyy-MM") === format(endDate, "yyyy-MM") && startDate.getDate() === 1 ? format(startDate, "yyyy-MM") : undefined)

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap gap-3 items-center">
        {branches && branches.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Cabang:</span>
            <Select
              value={currentBranchId || "all"}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger className="w-[180px]">
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
        )}

        {/* Month Picker */}
        <div className="w-[175px]">
          <MonthPicker
            value={activeMonthValue}
            onChange={handleMonthSelect}
            placeholder="Pilih Bulan"
            disabled={isPending}
          />
        </div>

        {/* Date Pickers */}
        <div className="flex gap-2 items-center">
          <DatePicker
            date={startDate}
            setDate={handleStartDateChange}
            placeholder="Tanggal Mulai"
          />
          <span className="text-muted-foreground">-</span>
          <DatePicker
            date={endDate}
            setDate={handleEndDateChange}
            placeholder="Tanggal Akhir"
          />
        </div>

        {hasActiveFilters && (
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
      </div>

      {isPending && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Memuat...
        </div>
      )}
    </div>
  )
}
