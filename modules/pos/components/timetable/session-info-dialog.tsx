import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, CheckCircle2, Play, User, Activity, Receipt, CreditCard, PlusCircle, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StaffCombobox } from "@/modules/staff/components/staff-combobox";
import { ProductCombobox } from "@/modules/product/components/product-combobox";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useTimetableStore } from "../../stores/timetable-store";

interface SessionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  onPayNow: () => void;
  staff: any[];
}

export function SessionInfoDialog({
  open,
  onOpenChange,
  session,
  onPayNow,
  staff,
}: SessionInfoDialogProps) {
  const {
    handleStart,
    handleComplete,
    handleProcessBooking,
    handleUpdateSessionStaff,
    handleUpdateSessionRoom,
    handleAddContinuationSegment,
    handleSwitchActiveSegment,
    handleStartSegment,
    branchId,
    rooms,
    products,
  } = useTimetableStore();

  const [segmentActionMode, setSegmentActionMode] = useState<"CONTINUE" | "SWITCH" | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [sameStaff, setSameStaff] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [sameRoom, setSameRoom] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isSubmittingSegment, setIsSubmittingSegment] = useState<boolean>(false);

  useEffect(() => {
    setSegmentActionMode(null);
    setSelectedServiceId("");
    setSameStaff(true);
    setSelectedStaffId("");
    setSameRoom(true);
    setSelectedRoomId("");
  }, [session?.id, open]);

  if (!session) return null;

  const segments: any[] = Array.isArray(session.segments) ? session.segments : [];
  const activeSegment = segments.find((s) => s.status === "IN_PROGRESS") || segments[segments.length - 1];
  const activeStaffId = activeSegment?.staffId || session.staffId || "";
  const activeRoomId = activeSegment?.roomId || session.roomId || "";
  const activeRoomName = rooms.find((r) => r.id === activeRoomId)?.name || "Ruangan saat ini";
  const activeStaffObj = staff.find((s) => s.id === activeStaffId);
  const activeStaffName = activeSegment?.staffName || (activeStaffObj ? `${activeStaffObj.firstName} ${activeStaffObj.lastName || ""}`.trim() : "Terapis saat ini");
  const serviceProducts = (products || []).filter((p: any) => p.isActive !== false);

  const handleSegmentSubmit = async () => {
    const targetStaffId = sameStaff ? activeStaffId : selectedStaffId;
    const targetRoomId = sameRoom ? activeRoomId : selectedRoomId;
    if (!selectedServiceId || !targetStaffId || !targetRoomId) {
      toast.error("Layanan, terapis, dan ruangan wajib dipilih.");
      return;
    }
    setIsSubmittingSegment(true);
    const ok =
      segmentActionMode === "CONTINUE"
        ? await handleAddContinuationSegment(session.id, selectedServiceId, targetStaffId, targetRoomId)
        : await handleSwitchActiveSegment(session.id, selectedServiceId, targetStaffId, targetRoomId);
    setIsSubmittingSegment(false);
    if (ok) {
      setSegmentActionMode(null);
      setSelectedServiceId("");
      setSameStaff(true);
      setSelectedStaffId("");
      setSameRoom(true);
      setSelectedRoomId("");
    }
  };

  const isCompleted = session.status === "COMPLETED";
  const isInProgress = session.status === "IN_PROGRESS";
  const isScheduled = session.status === "SCHEDULED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-zinc-200/60 shadow-2xl rounded-2xl gap-0">

        {/* Header Section */}
        <div className="px-6 pt-6 pb-5 bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-100 dark:border-zinc-800/50">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 text-left">
                <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {session.itemName}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {session.customerName}
                </DialogDescription>
              </div>
              <Badge
                variant={isCompleted ? "secondary" : isInProgress ? "default" : "outline"}
              >
                {isCompleted ? "Selesai" : isInProgress ? "Berlangsung" : "Terjadwal"}
              </Badge>
            </div>
          </DialogHeader>
        </div>

        {/* Body Section */}
        <div className="p-6 space-y-6">

          {/* Terapis Selection/Display */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Terapis
            </label>
            {isCompleted ? (
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium text-sm text-zinc-700 dark:text-zinc-300">
                {session.staff ? `${session.staff.firstName} ${session.staff.lastName}` : "-"}
              </div>
            ) : (
              <StaffCombobox
                value={session.staffId || ""}
                onChange={(val) => handleUpdateSessionStaff(session.id, val)}
                branchId={branchId || session.branchId}
                serviceId={session.serviceId}
                excludeSessionId={session.id}
              />
            )}
          </div>

          {/* Room Selection/Display */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Ruangan
            </label>
            {isCompleted ? (
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 font-medium text-sm text-zinc-700 dark:text-zinc-300">
                {rooms.find(r => r.id === session.roomId)?.name || "-"}
              </div>
            ) : (
              <Select value={session.roomId} onValueChange={(val) => handleUpdateSessionRoom(session.id, val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Ruangan" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => {
                    const isDisabled = !session.isVip && room.isVip;
                    return (
                      <SelectItem 
                        key={room.id} 
                        value={room.id}
                        disabled={isDisabled}
                      >
                        {room.name} {room.isVip ? "(VIP)" : ""}
                        {isDisabled && " - Tidak tersedia untuk layanan reguler"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900">
              <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Mulai {(session.actualStartTime || session.status === "COMPLETED") ? "(Aktual)" : "(Estimasi)"}
              </div>
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                {new Date(session.actualStartTime || session.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900">
              <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isCompleted ? "Selesai (Aktual)" : "Estimasi Selesai"}
              </div>
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                {(isCompleted && session.actualEndTime)
                  ? new Date(session.actualEndTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : session.endTime
                    ? new Date(session.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                    : "-"}
              </div>
            </div>
          </div>

          {/* Reference ID */}
          {(session.transactionItem?.transaction?.id || session.bookingId) && (
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                <Receipt className="w-4 h-4" />
                <span>ID Referensi</span>
              </div>
              <div className="font-mono text-xs font-semibold bg-zinc-200/50 dark:bg-zinc-800 px-2.5 py-1 rounded text-zinc-600 dark:text-zinc-300 tracking-tight">
                {session.transactionItem?.transaction?.id || session.bookingId}
              </div>
            </div>
          )}

          {/* Segments Timeline */}
          {segments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Segmen Layanan ({segments.length})
                </span>
                {!isCompleted && serviceProducts.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setSegmentActionMode(segmentActionMode === "CONTINUE" ? null : "CONTINUE")}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      Lanjut Servis
                    </Button>
                    {isInProgress && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => setSegmentActionMode(segmentActionMode === "SWITCH" ? null : "SWITCH")}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                        Ganti Servis
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {segments.map((seg) => {
                  const segStatusLabel =
                    seg.status === "COMPLETED"
                      ? "Selesai"
                      : seg.status === "IN_PROGRESS"
                      ? "Berlangsung"
                      : "Terjadwal";
                  return (
                    <div
                      key={seg.id}
                      className={cn(
                        "p-3 rounded-xl border text-xs flex items-center justify-between gap-2",
                        seg.status === "IN_PROGRESS"
                          ? "bg-primary/5 border-primary/30"
                          : "bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800"
                      )}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {seg.sequenceOrder}. {seg.serviceName}
                          {seg.switchReason === "MID_SESSION_SWITCH" && (
                            <span className="ml-1.5 text-[10px] font-medium text-amber-600">
                              (Pengganti)
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-500 dark:text-zinc-400 truncate">
                          {seg.staffName || "Belum ada terapis"}
                          {" · "}
                          {rooms.find((r) => r.id === (seg.roomId || session.roomId))?.name || "-"}
                          {" · "}
                          {seg.durationMinutes}m
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isInProgress && seg.status === "SCHEDULED" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-6 text-[11px] px-2"
                            onClick={() => handleStartSegment(session.id, seg.id)}
                          >
                            Mulai
                          </Button>
                        )}
                        <Badge
                          variant={
                            seg.status === "COMPLETED"
                              ? "secondary"
                              : seg.status === "IN_PROGRESS"
                              ? "default"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {segStatusLabel}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {segmentActionMode && (
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="text-xs font-semibold text-foreground">
                    {segmentActionMode === "CONTINUE"
                      ? "Tambah Layanan Lanjutan"
                      : "Ganti Layanan Sesi Berjalan (Harga Awal Tetap)"}
                  </div>

                  <ProductCombobox
                    branchId={branchId || session.branchId}
                    value={selectedServiceId}
                    onChange={setSelectedServiceId}
                  />

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="segment-same-staff"
                      checked={sameStaff}
                      onCheckedChange={(checked) => setSameStaff(checked === true)}
                    />
                    <label htmlFor="segment-same-staff" className="text-xs font-medium cursor-pointer">
                      Terapis sama ({activeStaffName})
                    </label>
                  </div>

                  {!sameStaff && (
                    <StaffCombobox
                      serviceId={selectedServiceId || undefined}
                      value={selectedStaffId}
                      onChange={setSelectedStaffId}
                      branchId={branchId || session.branchId}
                      excludeSessionId={session.id}
                    />
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="segment-same-room"
                      checked={sameRoom}
                      onCheckedChange={(checked) => setSameRoom(checked === true)}
                    />
                    <label htmlFor="segment-same-room" className="text-xs font-medium cursor-pointer">
                      Ruangan sama ({activeRoomName})
                    </label>
                  </div>

                  {!sameRoom && (
                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue placeholder="Pilih ruangan tujuan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} {room.isVip ? "(VIP)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSegmentActionMode(null)}
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        isSubmittingSegment ||
                        !selectedServiceId ||
                        (!sameStaff && !selectedStaffId) ||
                        (!sameRoom && !selectedRoomId)
                      }
                      onClick={handleSegmentSubmit}
                    >
                      {isSubmittingSegment ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-3">
            {isScheduled && session.booking?.status === "PENDING" && (
              <Button
                onClick={() => {
                  if (session.bookingId) handleProcessBooking(session.bookingId);
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Proses Booking
              </Button>
            )}

            {isScheduled && session.booking?.status !== "PENDING" && (
              <Button
                disabled={!session.staffId}
                onClick={() => {
                  if (!session.staffId) {
                    toast.error("Silakan pilih terapis terlebih dahulu.");
                    return;
                  }
                  handleStart(session.id);
                  onOpenChange(false);
                }}
              >
                <Play className="w-4 h-4 mr-2 fill-current" />
                Mulai Sesi
              </Button>
            )}

            {isInProgress && (
              <Button
                onClick={() => {
                  if (session.paymentStatus === "PENDING") {
                    toast.error("Tidak dapat menyelesaikan sesi. Pembayaran belum lunas.");
                    return;
                  }
                  handleComplete(session.id);
                  onOpenChange(false);
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Selesaikan Sesi
              </Button>
            )}

            {session.paymentStatus === "PENDING" && (
              <Button
                variant={'outline'}
                onClick={() => {
                  onPayNow();
                  onOpenChange(false);
                }}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Buat Pembayaran
              </Button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
