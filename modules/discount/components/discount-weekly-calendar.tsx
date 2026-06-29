"use client"

import { useState } from "react"
import { DiscountWithBranch } from "../types/discount"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DiscountForm } from "./discount-form"
import { Plus, Edit, Trash, Clock, MapPin, PercentCircle, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDiscountCalendar } from "../hooks/use-discount-calendar"
import { Switch } from "@/components/ui/switch"

interface DiscountWeeklyCalendarProps {
  data: DiscountWithBranch[]
  branches: { id: string, name: string }[]
}

const DAYS = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" },
  { value: "SUNDAY", label: "Minggu" },
]

export function DiscountWeeklyCalendar({ data, branches }: DiscountWeeklyCalendarProps) {
  const {
    isDialogOpen,
    setIsDialogOpen,
    editingDiscount,
    handleEdit,
    handleDelete,
    handleOpenChange,
    toggleActive
  } = useDiscountCalendar()

  // Group discounts by day
  const discountsByDay = DAYS.reduce((acc, day) => {
    acc[day.value] = data.filter(d => d.dayOfWeek === day.value)
    return acc
  }, {} as Record<string, DiscountWithBranch[]>)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Jadwal Diskon</h2>
          <p className="text-sm text-muted-foreground">Kelola diskon per hari dalam seminggu.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Diskon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingDiscount ? "Edit Diskon" : "Buat Diskon"}</DialogTitle>
            </DialogHeader>
            <DiscountForm
              initialData={editingDiscount}
              branches={branches}
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="grid grid-cols-7 gap-4 min-w-[1000px] xl:min-w-0">
          {DAYS.map(day => (
            <div key={day.value} className="flex flex-col space-y-4">
              <div className="bg-secondary/50 p-2 text-center rounded-lg border">
                <h3 className="font-medium text-sm">{day.label}</h3>
                <span className="text-xs text-muted-foreground">{discountsByDay[day.value].length} Diskon</span>
              </div>

              <div className="flex flex-col space-y-3">
                {discountsByDay[day.value].map(discount => (
                  <div
                    key={discount.id}
                    className={`border rounded-lg p-3 space-y-3 shadow-sm transition-all ${discount.isActive ? "bg-card border-primary/20" : "bg-muted/50 grayscale-[0.5] opacity-80"
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 text-primary font-bold text-xl pt-0.5">
                        <PercentCircle className="h-5 w-5" />
                        <span>{Number(discount.percentage)}%</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={discount.isActive}
                          onCheckedChange={(val) => toggleActive(discount, val)}
                          className="scale-75 origin-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{discount.startTime} - {discount.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">
                          {discount.branch ? discount.branch.name : "Universal (Semua)"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-start border-t pt-2 mt-2 gap-2">
                      <div className="text-xs text-muted-foreground line-clamp-2 pt-0.5" title={discount.name}>
                        {discount.name}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mr-1 -mt-1">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(discount)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleDelete(discount.id)}>
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {discountsByDay[day.value].length === 0 && (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <p className="text-xs">Tidak ada diskon.</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
