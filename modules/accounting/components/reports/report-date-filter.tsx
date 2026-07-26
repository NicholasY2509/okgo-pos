"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface ReportDateFilterProps {
  mode: "single" | "range"
}

export function ReportDateFilter({ mode }: ReportDateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentStartDate = searchParams.get("startDate")
  const currentEndDate = searchParams.get("endDate")
  const currentDate = searchParams.get("date")

  const [startDate, setStartDate] = useState<Date | undefined>(currentStartDate ? new Date(currentStartDate) : undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(currentEndDate ? new Date(currentEndDate) : undefined)
  const [date, setDate] = useState<Date | undefined>(currentDate ? new Date(currentDate) : new Date())

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    if (mode === "range") {
      if (startDate) params.set("startDate", startDate.toISOString())
      else params.delete("startDate")

      if (endDate) params.set("endDate", endDate.toISOString())
      else params.delete("endDate")
    } else {
      if (date) params.set("date", date.toISOString())
      else params.delete("date")
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  useEffect(() => {
    if (mode === "range") {
      if (startDate || endDate || (!startDate && currentStartDate) || (!endDate && currentEndDate)) {
        applyFilters()
      }
    } else {
      if (date || (!date && currentDate)) {
        applyFilters()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, date, mode])

  const clearFilters = () => {
    setStartDate(undefined)
    setEndDate(undefined)
    setDate(new Date()) // Default to today for single mode

    const params = new URLSearchParams(searchParams.toString())
    params.delete("startDate")
    params.delete("endDate")
    params.delete("date")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Label className="text-base font-semibold">Pilih Tanggal:</Label>
          <div className="flex gap-2 items-center">
            {mode === "range" ? (
              <>
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
              </>
            ) : (
              <DatePicker
                date={date}
                setDate={setDate}
                placeholder="Pilih Tanggal"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <div className="text-sm text-muted-foreground animate-pulse">
              Memuat...
            </div>
          )}

          {(currentStartDate || currentEndDate || (currentDate && mode === "single")) && (
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
      </CardContent>
    </Card>
  )
}
