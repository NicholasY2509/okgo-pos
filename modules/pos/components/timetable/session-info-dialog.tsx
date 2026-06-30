import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, Play, User, Activity, Receipt, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { StaffCombobox } from "@/modules/staff/components/staff-combobox";

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
  const { handleStart, handleComplete, handleProcessBooking, handleUpdateSessionStaff, branchId } = useTimetableStore();
  if (!session) return null;

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
              />
            )}
          </div>

          {/* Time Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900">
              <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Mulai
              </div>
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                {new Date(session.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            <div className="space-y-2 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800/80 shadow-sm transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-900">
              <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {isCompleted ? "Selesai" : "Estimasi"}
              </div>
              <div className="font-semibold text-zinc-700 dark:text-zinc-200">
                {session.endTime
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
