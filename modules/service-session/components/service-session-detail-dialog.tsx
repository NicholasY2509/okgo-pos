"use client"

import { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import {
  Calendar,
  Clock,
  User,
  Star,
  MapPin,
  Sparkles,
  Receipt,
  Play,
  CheckCircle2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatIDR } from "@/lib/utils"
import { toast } from "sonner"
import {
  startServiceSessionAction,
  endServiceSessionAction,
} from "../actions/service-session-action"
import type { ServiceSessionItem } from "../hooks/use-service-sessions"

interface ServiceSessionDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ServiceSessionItem | null
  tenantSlug: string
  onSessionUpdated?: () => void
}

export function ServiceSessionDetailDialog({
  open,
  onOpenChange,
  session,
  tenantSlug,
  onSessionUpdated,
}: ServiceSessionDetailDialogProps) {
  const [loadingAction, setLoadingAction] = useState(false)

  if (!session) return null

  const handleStart = async () => {
    setLoadingAction(true)
    const res = await startServiceSessionAction(session.id, tenantSlug)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Sesi layanan berhasil dimulai.")
      onSessionUpdated?.()
      onOpenChange(false)
    }
    setLoadingAction(false)
  }

  const handleEnd = async () => {
    setLoadingAction(true)
    const res = await endServiceSessionAction(session.id, tenantSlug)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Sesi layanan berhasil diselesaikan.")
      onSessionUpdated?.()
      onOpenChange(false)
    }
    setLoadingAction(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Sedang Berlangsung
          </Badge>
        )
      case "SCHEDULED":
        return (
          <Badge variant="secondary" className="font-medium">
            Terjadwal
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-600/30 text-emerald-600 dark:text-emerald-400 font-medium"
          >
            Selesai
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="font-medium">
            Dibatalkan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">
                Detail Sesi Layanan
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                ID: {session.id}
              </p>
            </div>
            {getStatusBadge(session.status)}
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Service & Room Card */}
          <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-semibold">
                  Layanan
                </span>
                <h4 className="text-lg font-bold text-foreground">
                  {session.serviceName}
                </h4>
              </div>
              {session.servicePrice != null && (
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Harga</span>
                  <div className="font-mono font-bold text-foreground">
                    {formatIDR(session.servicePrice)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>Ruangan: {session.roomName}</span>
                {session.roomIsVip && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1 rounded">
                    VIP
                  </span>
                )}
              </Badge>

              {session.serviceDuration && (
                <Badge variant="secondary" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Estimasi: {session.serviceDuration} Menit</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Time & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-xl p-3.5 space-y-1.5 bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Jadwal
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground text-xs block">Mulai:</span>
                <span className="font-medium">
                  {session.startTime
                    ? format(
                        new Date(session.startTime),
                        "dd MMMM yyyy HH:mm",
                        { locale: id }
                      )
                    : "-"}
                </span>
              </div>
              {session.endTime && (
                <div className="text-sm">
                  <span className="text-muted-foreground text-xs block">Selesai:</span>
                  <span className="font-medium">
                    {format(new Date(session.endTime), "dd MMMM yyyy HH:mm", {
                      locale: id,
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="border rounded-xl p-3.5 space-y-1.5 bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Waktu Aktual
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground text-xs block">Mulai Aktual:</span>
                <span className="font-medium">
                  {session.actualStartTime
                    ? format(
                        new Date(session.actualStartTime),
                        "dd MMMM yyyy HH:mm",
                        { locale: id }
                      )
                    : "-"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground text-xs block">Selesai Aktual:</span>
                <span className="font-medium">
                  {session.actualEndTime
                    ? format(
                        new Date(session.actualEndTime),
                        "dd MMMM yyyy HH:mm",
                        { locale: id }
                      )
                    : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Staff & Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border rounded-xl p-3.5 space-y-2 bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Terapis / Staf
              </div>
              <div className="font-medium text-foreground">
                {session.staffName || "Belum ditugaskan"}
              </div>
              {session.staffPhone && (
                <div className="text-xs text-muted-foreground">
                  Telp: {session.staffPhone}
                </div>
              )}
              {session.therapistCommissionAmount > 0 && (
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                  Komisi: {formatIDR(session.therapistCommissionAmount)}
                </div>
              )}
            </div>

            <div className="border rounded-xl p-3.5 space-y-2 bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <User className="w-3.5 h-3.5 text-primary" />
                Pelanggan
              </div>
              <div className="font-medium text-foreground">
                {session.customer?.name || "Pelanggan Umum"}
              </div>
              {session.customer?.phone && (
                <div className="text-xs text-muted-foreground">
                  Telp: {session.customer.phone}
                </div>
              )}
              {session.customer?.email && (
                <div className="text-xs text-muted-foreground">
                  Email: {session.customer.email}
                </div>
              )}
            </div>
          </div>

          {/* Reference & Origin */}
          {(session.bookingNumber || session.transactionNumber) && (
            <div className="border rounded-xl p-3.5 space-y-2 bg-card">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase">
                <Receipt className="w-3.5 h-3.5 text-primary" />
                Asal Transaksi / Pemesanan
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {session.bookingNumber && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      No. Booking:
                    </span>
                    <span className="font-mono font-medium">
                      {session.bookingNumber}
                    </span>
                    {session.bookingStatus && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {session.bookingStatus}
                      </Badge>
                    )}
                  </div>
                )}
                {session.transactionNumber && (
                  <div>
                    <span className="text-xs text-muted-foreground block">
                      No. Transaksi POS:
                    </span>
                    <span className="font-mono font-medium">
                      {session.transactionNumber}
                    </span>
                    {session.transactionStatus && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {session.transactionStatus}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating & Review */}
          {session.rating && (
            <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                Ulasan Pelanggan ({session.rating}/5)
              </div>
              {session.reviewComment ? (
                <p className="text-sm italic text-foreground">
                  &ldquo;{session.reviewComment}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Tidak ada komentar ulasan tertulis.
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {session.status === "SCHEDULED" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStart}
                  disabled={loadingAction}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Mulai Sesi
                </Button>
              )}
              {session.status === "IN_PROGRESS" && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnd}
                  disabled={loadingAction}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Selesaikan Sesi
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

