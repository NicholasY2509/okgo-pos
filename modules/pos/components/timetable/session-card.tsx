import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExistingTransactionPaymentModal } from "../existing-payment-modal";
import { useSessionCard } from "../../hooks/use-session-card";
import { SessionInfoDialog } from "./session-info-dialog";
import { Badge } from "@/components/ui/badge";

export function SessionCard({ session, lane = 0, onComplete, onStart, onUpdateTime, paymentMethods, onPaymentSuccess }: { session: any, lane?: number, onComplete: () => void, onStart: () => void, onUpdateTime?: (start: Date, end: Date) => void, paymentMethods: any[], onPaymentSuccess: () => void }) {
  const {
    infoOpen,
    setInfoOpen,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedPaymentTransaction,
    setSelectedPaymentTransaction,
    cardRef,
    isDragging,
    isResizingLeft,
    isResizingRight,
    isOutsideBusinessHours,
    left,
    width,
    timerText,
    timerColor,
    handlePointerDown,
  } = useSessionCard({ session, onUpdateTime });

  if (!session.startTime) return null;
  if (isOutsideBusinessHours) return null;

  return (
    <>
      <div
        ref={cardRef}
        onPointerDown={(e) => handlePointerDown(e, 'drag')}
        onClick={() => {
          if (session.status === "COMPLETED") setInfoOpen(true);
        }}
        className={cn(
          "absolute rounded-lg p-2 flex flex-col gap-1 overflow-hidden shadow-sm border group/card cursor-pointer",
          session.status === "IN_PROGRESS" ? "bg-primary/10 border-primary/30" :
            session.status === "COMPLETED" ? "bg-muted border-border opacity-70" :
              "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
          (isDragging || isResizingLeft || isResizingRight) ? "z-50 shadow-md opacity-90 transition-none" : "transition-all",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          left: `${left}%`,
          width: `${width}%`,
          top: `${lane * 80 + 8}px`,
          height: `72px`,
          minWidth: '50px',
          zIndex: (isDragging || isResizingLeft || isResizingRight) ? 50 : (session.status === "IN_PROGRESS" ? 10 : 1)
        }}
      >
        {/* Left Resize Handle */}
        {session.status !== "COMPLETED" && (
          <div
            className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 z-10"
            onPointerDown={(e) => handlePointerDown(e, 'resizeLeft')}
          />
        )}

        {/* Right Resize Handle */}
        {session.status !== "COMPLETED" && (
          <div
            className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/10 dark:hover:bg-white/10 z-10"
            onPointerDown={(e) => handlePointerDown(e, 'resizeRight')}
          />
        )}

        <div className="flex justify-between items-start gap-2 select-none pointer-events-none">
          <span className="font-semibold text-xs truncate" title={session.itemName}>
            {session.itemName}
          </span>
        </div>

        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5 mt-auto select-none pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[50%] font-medium" title={session.customerName}>
              {session.customerName}
            </span>
            <span className={cn("flex items-center gap-1 font-medium whitespace-nowrap", timerColor)}>
              {timerText}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="truncate max-w-[60%]" title={session.staff ? `${session.staff.firstName} ${session.staff.lastName}` : "Terapis"}>
              Terapis: {session.staff ? session.staff.firstName : "-"}
            </span>
            {session.paymentStatus === "PENDING" && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4 uppercase">
                Belum Lunas
              </Badge>
            )}
          </div>
        </div>
      </div>

      <SessionInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        session={session}
        onStart={onStart}
        onComplete={onComplete}
        onPayNow={() => {
          if (session.transactionItem?.transaction) {
            setSelectedPaymentTransaction(session.transactionItem.transaction);
            setIsPaymentModalOpen(true);
          }
        }}
      />

      {isPaymentModalOpen && selectedPaymentTransaction && (
        <ExistingTransactionPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentTransaction(null);
          }}
          transaction={selectedPaymentTransaction}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            setSelectedPaymentTransaction(null);
            onPaymentSuccess();
          }}
        />
      )}
    </>
  );
}
