"use client"

import * as React from "react"
import { format, setMonth, setYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface MonthPickerProps {
  value?: string // YYYY-MM format
  onChange: (value: string) => void
  placeholder?: string
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Select month",
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse existing value or use current date for the calendar view
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (value) {
      const [year, month] = value.split("-")
      return new Date(parseInt(year), parseInt(month) - 1, 1)
    }
    return new Date()
  })

  React.useEffect(() => {
    if (value) {
      const [year, month] = value.split("-")
      setViewDate(new Date(parseInt(year), parseInt(month) - 1, 1))
    }
  }, [value])

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ]

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(viewDate, monthIndex)
    setViewDate(newDate)
    onChange(format(newDate, "yyyy-MM"))
    setOpen(false)
  }

  const handlePrevYear = () => setViewDate(setYear(viewDate, viewDate.getFullYear() - 1))
  const handleNextYear = () => setViewDate(setYear(viewDate, viewDate.getFullYear() + 1))

  const selectedYear = value ? parseInt(value.split('-')[0]) : null
  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-background",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(viewDate, "MMMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-4" align="start">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={handlePrevYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="font-medium text-sm">{format(viewDate, "yyyy")}</div>
          <Button variant="outline" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, idx) => {
            const isSelected = selectedYear === viewDate.getFullYear() && selectedMonth === idx
            return (
              <Button
                key={month}
                variant={isSelected ? "default" : "ghost"}
                className="h-9 w-full text-sm font-normal"
                onClick={() => handleMonthSelect(idx)}
              >
                {month}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
