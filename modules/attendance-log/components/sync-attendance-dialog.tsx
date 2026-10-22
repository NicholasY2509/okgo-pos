"use client"

import * as React from "react"
import { RefreshCw, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSyncAttendance } from "../hooks/use-sync-attendance"

export interface SyncMachineOption {
  id: string
  name: string
  sn: string
  ipAddress?: string | null
  port?: number | null
}

interface SyncAttendanceDialogProps {
  machines?: SyncMachineOption[]
}

export function SyncAttendanceDialog({ machines = [] }: SyncAttendanceDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { form, isSyncing, result, onSubmit } = useSyncAttendance()

  const machinesWithIp = machines.filter((m) => Boolean(m.ipAddress))

  // If there is a registered machine with an IP and form has no IP set, prefill it
  React.useEffect(() => {
    if (machinesWithIp.length > 0 && !form.getValues("ipAddress")) {
      form.setValue("ipAddress", machinesWithIp[0].ipAddress || "")
    }
  }, [machinesWithIp, form])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tarik Log dari Mesin
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tarik Log Absensi Mesin</DialogTitle>
          <DialogDescription>
            Menghubungi mesin absensi Fingerspot via Wi-Fi/LAN untuk menyinkronkan seluruh riwayat log mentah (raw punch records).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-2">
          {machinesWithIp.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Pilih Mesin Terdaftar:
              </Label>
              <div className="flex flex-wrap gap-2">
                {machinesWithIp.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    variant={form.watch("ipAddress") === m.ipAddress ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (m.ipAddress) {
                        form.setValue("ipAddress", m.ipAddress)
                      }
                    }}
                  >
                    {m.name} ({m.ipAddress})
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ipAddress">Alamat IP Mesin (Wi-Fi / LAN)</Label>
            <Input
              id="ipAddress"
              placeholder="192.168.1.231"
              {...form.register("ipAddress")}
              disabled={isSyncing}
            />
            {form.formState.errors.ipAddress && (
              <p className="text-xs text-destructive">
                {form.formState.errors.ipAddress.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...form.register("username")}
                disabled={isSyncing}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                disabled={isSyncing}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="ignoreUnrecognized"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              checked={form.watch("ignoreUnrecognized")}
              onChange={(e) => form.setValue("ignoreUnrecognized", e.target.checked)}
              disabled={isSyncing}
            />
            <Label htmlFor="ignoreUnrecognized" className="text-xs font-normal cursor-pointer">
              Abaikan scan tidak dikenal / visitor (hanya simpan log karyawan)
            </Label>
          </div>

          {result && (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1">
              <div className="font-semibold text-foreground">Hasil Sinkronisasi:</div>
              <div>Mesin: {result.machineName || result.deviceSn} ({result.deviceSn})</div>
              <div>Total record di mesin: <span className="font-medium">{result.totalFound}</span></div>
              <div className="text-green-600 dark:text-green-400 font-medium">Log baru diimpor: {result.imported}</div>
              {result.unrecognizedSkipped > 0 && (
                <div className="text-amber-600 dark:text-amber-400">
                  Scan tidak dikenal diabaikan: {result.unrecognizedSkipped}
                </div>
              )}
              <div className="text-muted-foreground">Sudah ada di database: {result.skipped}</div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSyncing}
            >
              Tutup
            </Button>
            <Button type="submit" disabled={isSyncing} className="gap-2">
              <RefreshCw className={isSyncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {isSyncing ? "Menarik data..." : "Mulai Tarik Log"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
