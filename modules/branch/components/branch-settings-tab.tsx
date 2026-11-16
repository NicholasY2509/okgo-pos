"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CalendarCheck2, Info, Loader2, Save } from "lucide-react"
import { useBranchSettings } from "../hooks/use-branch-settings"

interface BranchSettingsTabProps {
  branchId: string
  branchName: string
  initialMaxDailyBookings: number | null
}

/**
 * Renders branch-level operational settings, including daily booking slot limits.
 */
export function BranchSettingsTab({
  branchId,
  branchName,
  initialMaxDailyBookings,
}: BranchSettingsTabProps) {
  const {
    form,
    isLimitEnabled,
    handleToggleLimit,
    onSubmit,
    isSubmitting,
    error,
  } = useBranchSettings({
    branchId,
    initialMaxDailyBookings,
  })

  const maxDailyBookingsValue = form.watch("maxDailyBookings")

  return (
    <form onSubmit={onSubmit}>
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" />
            <CardTitle>Kuota Booking Harian</CardTitle>
          </div>
          <CardDescription>
            Atur batas maksimal slot booking yang dapat diterima cabang {branchName} dalam satu hari.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="toggle-daily-limit" className="text-base font-medium">
                Batasi Kuota Booking Harian
              </Label>
              <p className="text-sm text-muted-foreground">
                Jika dinonaktifkan, cabang menerima booking selama ruangan dan terapis masih tersedia.
              </p>
            </div>
            <Switch
              id="toggle-daily-limit"
              checked={isLimitEnabled}
              onCheckedChange={handleToggleLimit}
            />
          </div>

          {isLimitEnabled && (
            <div className="space-y-2">
              <Label htmlFor="maxDailyBookings">Maksimal Slot Booking per Hari</Label>
              <Input
                id="maxDailyBookings"
                type="number"
                min={1}
                step={1}
                placeholder="cth. 20"
                value={maxDailyBookingsValue ?? ""}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === "") {
                    form.setValue("maxDailyBookings", null, { shouldValidate: true })
                    return
                  }
                  const parsed = Number.parseInt(raw, 10)
                  form.setValue(
                    "maxDailyBookings",
                    Number.isNaN(parsed) ? null : parsed,
                    { shouldValidate: true }
                  )
                }}
              />
              {form.formState.errors.maxDailyBookings && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.maxDailyBookings.message}
                </p>
              )}
              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Perhitungan menggunakan jumlah layanan (slot) per hari. Contoh: 1 booking dengan 3 layanan dihitung sebagai 3 slot. Booking yang dibatalkan (CANCELLED) tidak mengurangi kuota.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm font-medium text-destructive" aria-live="polite">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
