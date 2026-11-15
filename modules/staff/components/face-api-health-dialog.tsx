"use client"

import { useState } from "react"
import { CheckCircle2, Loader2, RefreshCw, ScanFace, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFaceApiHealth } from "@/modules/staff/hooks/use-face-api-health"

interface StatusRowProps {
  label: string
  passed: boolean
  detail: string
}

function StatusRow({ label, passed, detail }: StatusRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{detail}</p>
      </div>
      {passed ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      )}
    </div>
  )
}

export function FaceApiHealthDialog() {
  const [open, setOpen] = useState(false)
  const { status, isChecking, error, checkConnection } = useFaceApiHealth()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen && !status && !isChecking) {
      void checkConnection()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ScanFace className="mr-2 h-4 w-4" />
          Tes Face API
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tes Koneksi Face Recognition API</DialogTitle>
          <DialogDescription>
            Memeriksa validitas .env (FACE_API_URL & FACE_API_TOKEN) serta koneksi ke layanan InsightFace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isChecking && !status && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memeriksa koneksi ke Face API...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {status && (
            <>
              <StatusRow
                label="FACE_API_URL"
                passed={status.hasUrl && status.envValid}
                detail={status.configuredUrl ?? "Belum dikonfigurasi di .env"}
              />
              <StatusRow
                label="FACE_API_TOKEN (.env)"
                passed={status.hasToken}
                detail={status.hasToken ? "Terpasang" : "Belum dikonfigurasi di .env"}
              />
              <StatusRow
                label="Endpoint /health"
                passed={status.healthReachable}
                detail={
                  status.healthReachable
                    ? `Terhubung (${status.latencyMs ?? 0} ms)`
                    : "Tidak dapat dijangkau"
                }
              />
              <StatusRow
                label="Validasi Bearer Token"
                passed={status.tokenValid}
                detail={
                  status.tokenValid
                    ? "Token diterima oleh Face API"
                    : "Token ditolak atau belum diuji"
                }
              />
              <div
                className={`rounded-lg border p-3 text-xs ${
                  status.ok
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                {status.message}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => void checkConnection()}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isChecking ? "Memeriksa..." : "Jalankan Tes Ulang"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
