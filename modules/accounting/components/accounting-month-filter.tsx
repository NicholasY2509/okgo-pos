"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MonthPicker } from "@/components/ui/month-picker"
import { format, addMonths, subMonths, parse } from "date-fns"

interface AccountingMonthFilterProps {
  currentMonth: string // "yyyy-MM"
  className?: string
}

export function AccountingMonthFilter({
  currentMonth,
  className,
}: AccountingMonthFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Parse currentMonth date
  const selectedDate = parse(currentMonth, "yyyy-MM", new Date())
  const today = new Date()
  const actualCurrentMonthStr = format(today, "yyyy-MM")
  const isActualCurrentMonth = currentMonth === actualCurrentMonthStr

  const updateMonth = (newMonthStr: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newMonthStr === actualCurrentMonthStr) {
      params.delete("month")
    } else {
      params.set("month", newMonthStr)
    }

    startTransition(() => {
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const handlePrevMonth = () => {
    const prevDate = subMonths(selectedDate, 1)
    updateMonth(format(prevDate, "yyyy-MM"))
  }

  const handleNextMonth = () => {
    const nextDate = addMonths(selectedDate, 1)
    updateMonth(format(nextDate, "yyyy-MM"))
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="flex items-center bg-card border border-border rounded-xl p-0.5 shadow-2xs">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevMonth}
          disabled={isPending}
          title="Bulan Sebelumnya"
          className="rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center">
          <MonthPicker
            value={currentMonth}
            onChange={updateMonth}
            disabled={isPending}
            className="h-7 border-none shadow-none font-semibold text-xs sm:text-sm text-foreground hover:bg-muted/50 rounded-lg px-2.5 focus:ring-0"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleNextMonth}
          disabled={isPending}
          title="Bulan Berikutnya"
          className="rounded-lg text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!isActualCurrentMonth && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateMonth(actualCurrentMonthStr)}
          disabled={isPending}
          className="h-8 rounded-xl text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
        >
          Bulan Ini
        </Button>
      )}

      {isPending && (
        <span className="text-xs text-muted-foreground animate-pulse ml-1">
          Memuat...
        </span>
      )}
    </div>
  )
}
