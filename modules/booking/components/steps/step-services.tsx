"use client"

import { useState } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { BookingInput } from "../../schemas/booking"
import { Button } from "@/components/ui/button"
import { Plus, X, ChevronLeft } from "lucide-react"
import { addMinutes } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

interface StepCategory {
  id: string
  name: string
  targetWorkPositionId?: string | null
}

interface StepServiceItem {
  id: string
  name: string
  duration: number
  price: number | string
  categoryId?: string
  category?: StepCategory
}

interface StepStaffItem {
  id: string
  firstName: string
  lastName?: string
  workPositionId?: string | null
}

interface StepSession {
  startTime: string
  endTime: string
}

interface StepStaffSchedule {
  id: string
  sessions: StepSession[]
}

interface StepDailySchedule {
  staffSchedules: StepStaffSchedule[]
}

interface StepServicesProps {
  form: UseFormReturn<BookingInput>
  services: StepServiceItem[]
  staffList: StepStaffItem[]
  dailySchedule: StepDailySchedule | null
  loading: boolean
}

export function StepServices({
  form,
  services,
  staffList,
  dailySchedule,
}: StepServicesProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections",
  })

  const categories: StepCategory[] = Array.from(
    new Map(
      services.map((s) => [
        s.category?.id || "other",
        {
          id: s.category?.id || "other",
          name: s.category?.name || "Lainnya",
          targetWorkPositionId: s.category?.targetWorkPositionId || null,
        },
      ])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name))

  const [activeCategories, setActiveCategories] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {}
    fields.forEach((field, idx) => {
      const sId =
        (field as { serviceId?: string }).serviceId ||
        form.getValues(`selections.${idx}.serviceId`)
      if (sId) {
        const service = services.find((s) => s.id === sId)
        if (service) {
          initial[field.id] =
            service.category?.id || service.categoryId || "other"
        }
      }
    })
    return initial
  })

  // Track explicit therapist choice per field item ("any" | staffId | undefined)
  const [therapistChoice, setTherapistChoice] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {}
    fields.forEach((field, idx) => {
      const sId =
        (field as { serviceId?: string }).serviceId ||
        form.getValues(`selections.${idx}.serviceId`)
      const stId =
        (field as { staffId?: string }).staffId ||
        form.getValues(`selections.${idx}.staffId`)
      if (sId && stId) {
        initial[field.id] = stId
      }
    })
    return initial
  })

  // Track collapsed/compact state per field item
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    fields.forEach((field, idx) => {
      const sId =
        (field as { serviceId?: string }).serviceId ||
        form.getValues(`selections.${idx}.serviceId`)
      if (sId) {
        initial[field.id] = true
      }
    })
    return initial
  })

  const handleAdd = () => {
    // Compact all existing selections that already have a service selected
    setCollapsed((prev) => {
      const next = { ...prev }
      fields.forEach((f, idx) => {
        const sId = form.getValues(`selections.${idx}.serviceId`)
        if (sId) {
          next[f.id] = true
        }
      })
      return next
    })
    append({ serviceId: "", staffId: undefined })
  }

  const handleCategoryChange = (fieldId: string, categoryId: string) => {
    setActiveCategories((prev) => ({ ...prev, [fieldId]: categoryId }))
  }

  const handleSelectStaff = (
    fieldId: string,
    index: number,
    choice: "any" | string
  ) => {
    setTherapistChoice((prev) => ({ ...prev, [fieldId]: choice }))
    form.setValue(
      `selections.${index}.staffId`,
      choice === "any" ? undefined : choice,
      { shouldValidate: true }
    )
    // Smoothly and immediately compact the item
    setTimeout(() => {
      setCollapsed((prev) => ({ ...prev, [fieldId]: true }))
    }, 120)
  }

  const selectedTime = form.watch("startTime")

  const checkStaffBusy = (staffId: string, start: Date, end: Date) => {
    if (!dailySchedule) return false
    const staffSched = dailySchedule.staffSchedules.find(
      (s) => s.id === staffId
    )
    if (!staffSched) return false

    for (const session of staffSched.sessions) {
      const sStart = new Date(session.startTime)
      const sEnd = new Date(session.endTime)
      if (start < sEnd && end > sStart) {
        return `Sibuk ${sStart.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} - ${sEnd.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
      }
    }
    return false
  }

  return (
    <div className="animate-in space-y-6 duration-300 fade-in slide-in-from-right-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <h2 className="font-display text-3xl font-light tracking-tight">
            Pilih Layanan
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const selectedServiceId = form.watch(`selections.${index}.serviceId`)
          const selectedStaffId = form.watch(`selections.${index}.staffId`)
          const selectedService = services.find(
            (s) => s.id === selectedServiceId
          )
          const selectedStaff = staffList.find((s) => s.id === selectedStaffId)
          const currentChoice = therapistChoice[field.id]
          const isCollapsed = !!collapsed[field.id] && !!selectedService

          const currentCategoryId =
            activeCategories[field.id] || selectedService?.category?.id
          const selectedCategory = categories.find(
            (c) => c.id === currentCategoryId
          )

          const therapistLabel = selectedStaff
            ? selectedStaff.firstName
            : currentChoice === "any"
              ? "Siapa Saja"
              : "Belum Ditentukan"

          return (
            <div key={field.id} className="relative">
              <AnimatePresence initial={false} mode="wait">
                {isCollapsed && selectedService ? (
                  /* Elegant Minimalist Compact Card */
                  <motion.div
                    key="compact"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [field.id]: false }))
                    }
                    className="group relative cursor-pointer rounded-2xl border border-border/20 bg-background/50 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.01]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                            Layanan {index + 1}
                          </span>
                          {selectedCategory && (
                            <span className="text-[9px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                              / {selectedCategory.name}
                            </span>
                          )}
                        </div>

                        <h4 className="font-display text-lg font-light text-foreground transition-colors group-hover:text-primary md:text-xl">
                          {selectedService.name}
                        </h4>

                        <div className="flex flex-wrap items-center gap-2 text-xs font-light text-muted-foreground">
                          <span>{selectedService.duration} Menit</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>Terapis: {therapistLabel}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-light tracking-[0.15em] text-muted-foreground uppercase transition-colors group-hover:text-foreground">
                            Ubah
                          </span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                remove(index)
                                setCollapsed((prev) => {
                                  const next = { ...prev }
                                  delete next[field.id]
                                  return next
                                })
                                setTherapistChoice((prev) => {
                                  const next = { ...prev }
                                  delete next[field.id]
                                  return next
                                })
                              }}
                              className="cursor-pointer p-0.5 text-muted-foreground/60 transition-colors hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="font-mono text-base font-light tracking-wide text-foreground tabular-nums md:text-lg">
                          Rp{" "}
                          {Number(selectedService.price).toLocaleString(
                            "id-ID"
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Expanded Selection View */
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="relative rounded-2xl border border-border/20 bg-background/50 p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                          Layanan {index + 1}
                        </span>
                        {selectedCategory && (
                          <span className="text-xs font-light text-foreground">
                            / {selectedCategory.name}
                          </span>
                        )}
                      </div>

                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            remove(index)
                            setCollapsed((prev) => {
                              const next = { ...prev }
                              delete next[field.id]
                              return next
                            })
                            setTherapistChoice((prev) => {
                              const next = { ...prev }
                              delete next[field.id]
                              return next
                            })
                          }}
                          className="cursor-pointer p-1 text-muted-foreground/60 transition-colors hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {!activeCategories[field.id] ? (
                      <div className="mb-2 grid animate-in grid-cols-2 gap-4 duration-300 zoom-in-95 fade-in sm:grid-cols-2 lg:grid-cols-2">
                        {categories.map((cat) => {
                          let eligibleStaff = staffList
                          if (cat.targetWorkPositionId) {
                            eligibleStaff = staffList.filter(
                              (s) =>
                                s.workPositionId === cat.targetWorkPositionId
                            )
                          }
                          const itemStartTime = selectedTime
                            ? new Date(selectedTime)
                            : new Date()
                          const itemEndTime = addMinutes(itemStartTime, 60)
                          const availableCount = eligibleStaff.filter(
                            (s) =>
                              !checkStaffBusy(s.id, itemStartTime, itemEndTime)
                          ).length

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() =>
                                handleCategoryChange(field.id, cat.id)
                              }
                              className="group relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-border/20 bg-transparent p-6 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.02]"
                            >
                              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition-transform group-hover:scale-110">
                                <span className="font-display text-xl font-light">
                                  {cat.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-center text-lg font-light tracking-wide text-foreground">
                                  {cat.name}
                                </span>
                                <span className="text-center text-[10px] tracking-widest text-muted-foreground uppercase">
                                  {availableCount} Terapis
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex animate-in items-center justify-between gap-3 duration-300 fade-in">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleCategoryChange(field.id, "")
                              form.setValue(
                                `selections.${index}.serviceId`,
                                "",
                                {
                                  shouldValidate: true,
                                }
                              )
                              form.setValue(
                                `selections.${index}.staffId`,
                                undefined,
                                { shouldValidate: true }
                              )
                              setTherapistChoice((prev) => {
                                const next = { ...prev }
                                delete next[field.id]
                                return next
                              })
                              setCollapsed((prev) => ({
                                ...prev,
                                [field.id]: false,
                              }))
                            }}
                            className="rounded-full px-0 text-xs"
                          >
                            <ChevronLeft className="h-3 w-3" />
                            Kembali ke Kategori
                          </Button>
                          <span className="font-display text-base text-foreground">
                            {
                              categories.find(
                                (c) => c.id === activeCategories[field.id]
                              )?.name
                            }
                          </span>
                        </div>

                        <div className="grid max-h-87.5 animate-in grid-cols-1 gap-3 overflow-y-auto pr-2 duration-300 fade-in slide-in-from-top-4 sm:grid-cols-2 lg:grid-cols-3">
                          {services
                            .filter((service) => {
                              const activeCatId = activeCategories[field.id]
                              return (
                                (service.categoryId || "other") === activeCatId
                              )
                            })
                            .map((service) => (
                              <div
                                key={service.id}
                                className={`flex cursor-pointer flex-col justify-center rounded-2xl border p-4 transition-all ${selectedServiceId === service.id
                                  ? "border-primary bg-primary/[0.03]"
                                  : "border-border/20 bg-transparent hover:border-primary/30"
                                  }`}
                                onClick={() => {
                                  const isSame =
                                    selectedServiceId === service.id
                                  form.setValue(
                                    `selections.${index}.serviceId`,
                                    isSame ? "" : service.id,
                                    { shouldValidate: true }
                                  )
                                  if (isSame) {
                                    setTherapistChoice((prev) => {
                                      const next = { ...prev }
                                      delete next[field.id]
                                      return next
                                    })
                                  }
                                }}
                              >
                                <div
                                  className={`mb-2 text-base font-light ${selectedServiceId === service.id
                                    ? "text-primary"
                                    : "text-foreground"
                                    }`}
                                >
                                  {service.name}
                                </div>
                                <div className="flex justify-between text-[10px] font-light tracking-widest text-muted-foreground uppercase">
                                  <span>{service.duration} mnt</span>
                                  <span
                                    className={
                                      selectedServiceId === service.id
                                        ? "font-medium text-primary"
                                        : "text-foreground"
                                    }
                                  >
                                    Rp{" "}
                                    {Number(service.price).toLocaleString(
                                      "id-ID"
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>

                        {selectedServiceId && (
                          <div className="mt-6 animate-in border-t border-border/20 pt-4 duration-300 fade-in slide-in-from-top-2">
                            <div className="mb-3 flex items-center justify-between px-1">
                              <h4 className="text-[9px] font-bold tracking-[0.25em] text-muted-foreground uppercase">
                                Pilih Terapis
                              </h4>
                            </div>

                            {(() => {
                              const targetPositionId =
                                selectedService?.category?.targetWorkPositionId
                              let eligibleStaffList = staffList
                              if (targetPositionId) {
                                eligibleStaffList = staffList.filter(
                                  (s) => s.workPositionId === targetPositionId
                                )
                              }

                              const duration = selectedService?.duration || 60
                              const itemStartTime = selectedTime
                                ? new Date(selectedTime)
                                : new Date()
                              const itemEndTime = addMinutes(
                                itemStartTime,
                                duration
                              )

                              const isAnySelected = currentChoice === "any"

                              return (
                                <div
                                  className="flex snap-x gap-3 overflow-x-auto scroll-smooth px-1 pb-2"
                                  style={{
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none",
                                  }}
                                >
                                  {/* Siapa Saja Option - Neutral until chosen */}
                                  <div
                                    className={`flex h-28 w-24 shrink-0 cursor-pointer snap-center flex-col items-center justify-start gap-1 rounded-2xl border p-2 pt-4 transition-all ${isAnySelected
                                      ? "border-primary bg-primary/[0.03]"
                                      : "border-border/20 bg-transparent hover:border-primary/30"
                                      }`}
                                    onClick={() =>
                                      handleSelectStaff(field.id, index, "any")
                                    }
                                  >
                                    <div
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${isAnySelected
                                        ? "border-primary/40 bg-primary/10 text-primary"
                                        : "border-border/30 bg-muted/40 text-muted-foreground"
                                        }`}
                                    >
                                      <span className="text-sm font-light">
                                        ?
                                      </span>
                                    </div>
                                    <div className="mt-2 text-center text-[10px] leading-tight font-medium">
                                      Siapa Saja
                                    </div>
                                    <div className="mt-1 line-clamp-2 text-center text-[8px] tracking-widest text-muted-foreground uppercase">
                                      Tersedia
                                    </div>
                                  </div>

                                  {eligibleStaffList.length === 0 && (
                                    <div className="flex h-28 w-40 shrink-0 snap-center flex-col items-center justify-center rounded-2xl border border-border/20 p-2 text-center">
                                      <p className="text-[10px] text-muted-foreground">
                                        Tidak ada staf dengan role yang sesuai.
                                      </p>
                                    </div>
                                  )}

                                  {eligibleStaffList.map(
                                    (staff: StepStaffItem) => {
                                      const busyReason = checkStaffBusy(
                                        staff.id,
                                        itemStartTime,
                                        itemEndTime
                                      )
                                      const isBusy = !!busyReason
                                      const isStaffSelected =
                                        currentChoice === staff.id

                                      return (
                                        <div
                                          key={staff.id}
                                          className={`flex h-28 w-24 shrink-0 snap-center flex-col items-center justify-start gap-1 rounded-2xl border p-2 pt-4 transition-all ${isBusy
                                            ? "cursor-not-allowed border-border/10 opacity-40"
                                            : isStaffSelected
                                              ? "cursor-pointer border-primary bg-primary/[0.03]"
                                              : "cursor-pointer border-border/20 bg-transparent hover:border-primary/30"
                                            }`}
                                          onClick={() => {
                                            if (!isBusy) {
                                              handleSelectStaff(
                                                field.id,
                                                index,
                                                staff.id
                                              )
                                            }
                                          }}
                                        >
                                          <div
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${isStaffSelected
                                              ? "bg-primary/20 text-primary"
                                              : "border border-border/30 bg-muted text-muted-foreground"
                                              }`}
                                          >
                                            <span className="text-sm font-light">
                                              {staff.firstName
                                                .charAt(0)
                                                .toUpperCase()}
                                            </span>
                                          </div>
                                          <div className="mt-2 w-full truncate text-center text-[10px] leading-tight font-medium">
                                            {staff.firstName}
                                          </div>
                                          <div
                                            className={`mt-1 line-clamp-2 w-full px-1 text-center text-[8px] leading-[10px] tracking-widest uppercase ${isBusy
                                              ? "text-destructive"
                                              : "text-muted-foreground"
                                              }`}
                                          >
                                            {isBusy ? busyReason : "Tersedia"}
                                          </div>
                                        </div>
                                      )
                                    }
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {form.formState.errors.selections?.[index]?.serviceId && (
                <p className="mt-2 ml-2 text-xs text-destructive">
                  {form.formState.errors.selections[index]?.serviceId?.message}
                </p>
              )}
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-none border border-border/30 text-xs font-light tracking-[0.2em] text-foreground uppercase hover:border-foreground/50 hover:bg-transparent"
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4" /> Tambah Layanan Lagi
        </Button>

        {form.formState.errors.selections?.root && (
          <p className="mt-2 text-center text-sm text-destructive">
            {form.formState.errors.selections.root.message}
          </p>
        )}
      </div>
    </div>
  )
}
