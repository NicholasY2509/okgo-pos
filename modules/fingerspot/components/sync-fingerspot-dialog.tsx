"use client"

import { useState } from "react"
import { CloudDownload, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getAttlogAction } from "../actions/fingerspot-action"

interface SyncFingerspotDialogProps {
  machines: Array<{
    id: string
    name: string
    sn: string
  }>
  buttonVariant?: "default" | "outline" | "secondary"
  buttonText?: string
}

export function SyncFingerspotDialog({
  machines = [],
  buttonVariant = "default",
  buttonText = "Tarik Fingerspot Cloud",
}: SyncFingerspotDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const todayStr = new Date().toISOString().slice(0, 10)
  const [selectedSn, setSelectedSn] = useState(machines[0]?.sn || "S118001804")
  const [startDate, setStartDate] = useState(todayStr)
  const [endDate, setEndDate] = useState(todayStr)

  async function handleSync() {
    if (!selectedSn) {
      toast.error("Pilih mesin terlebih dahulu.")
      return
    }

    setIsLoading(true)

    const res = await getAttlogAction({
      cloudId: selectedSn,
      startDate,
      endDate,
      importToDatabase: true,
    })

    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      const items = res.data.rawResponse.data || []
      toast.success(
        `Berhasil menyinkronkan ${items.length} scan dari Fingerspot Cloud (${res.data.importedCount} baru diolah, ${res.data.skippedCount} sudah ada).`
      )
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="gap-2">
          <CloudDownload className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudDownload className="h-5 w-5 text-primary" />
            Tarik Data dari Fingerspot Cloud
          </DialogTitle>
          <DialogDescription>
            Mengambil log absensi biometrik secara langsung dari developer.fingerspot.io dan mengolahnya menjadi data kehadiran karyawan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="machine-select">Mesin Absensi (Cloud ID)</Label>
            <select
              id="machine-select"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedSn}
              onChange={(e) => setSelectedSn(e.target.value)}
            >
              {machines.length === 0 ? (
                <option value="S118001804">S118001804</option>
              ) : (
                machines.map((m) => (
                  <option key={m.id} value={m.sn}>
                    {m.name} ({m.sn})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sync-start-date">Tanggal Mulai</Label>
              <Input
                id="sync-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sync-end-date">Tanggal Akhir</Label>
              <Input
                id="sync-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Maksimal rentang tanggal adalah 2 hari per tarikan sesuai ketentuan Fingerspot API.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSync} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Menyinkronkan..." : "Mulai Tarik & Olah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

