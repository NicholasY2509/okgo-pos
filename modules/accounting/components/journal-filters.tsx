"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

export function JournalFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStartDate = searchParams.get("startDate")
  const currentEndDate = searchParams.get("endDate")

  const [startDate, setStartDate] = useState<Date | undefined>(currentStartDate ? new Date(currentStartDate) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(currentEndDate ? new Date(currentEndDate) : undefined)

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (startDate) {
      params.set("startDate", startDate.toISOString())
    } else {
      params.delete("startDate")
    }

    if (endDate) {
      params.set("endDate", endDate.toISOString())
    } else {
      params.delete("endDate")
    }

    params.set("page", "1")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Update URL automatically when dates change
  useEffect(() => {
    // Only apply if both are selected, or if user explicitly clears them
    // Actually, let's just let the user pick and automatically apply
    if (startDate || endDate || (!startDate && currentStartDate) || (!endDate && currentEndDate)) {
        applyFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const clearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("startDate")
    params.delete("endDate")
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
      <div className="flex gap-2 items-center">
        <DatePicker
          date={startDate}
          setDate={setStartDate}
          placeholder="Tanggal Mulai"
        />
        <span className="text-muted-foreground">-</span>
        <DatePicker
          date={endDate}
          setDate={setEndDate}
          placeholder="Tanggal Akhir"
        />
      </div>

      {(currentStartDate || currentEndDate) && (
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
