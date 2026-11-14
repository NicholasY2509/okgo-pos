"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSendInvoiceWhatsapp } from "../hooks/use-send-invoice-whatsapp";
import { MessageSquare, Download, Loader2, Send, FileText } from "lucide-react";

interface SendWhatsappInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    id: string;
    transactionNumber: string;
    customer?: {
      name?: string | null;
      phone?: string | null;
    } | null;
    totalAmount?: number | string;
  } | null;
}

export function SendWhatsappInvoiceDialog({
  open,
  onOpenChange,
  transaction,
}: SendWhatsappInvoiceDialogProps) {
  if (!transaction) return null;

  return (
    <SendWhatsappInvoiceDialogInner
      key={transaction.id}
      open={open}
      onOpenChange={onOpenChange}
      transaction={transaction}
    />
  );
}

function SendWhatsappInvoiceDialogInner({
  open,
  onOpenChange,
  transaction,
}: SendWhatsappInvoiceDialogProps & { transaction: NonNullable<SendWhatsappInvoiceDialogProps["transaction"]> }) {
  const {
    phoneNumber,
    setPhoneNumber,
    caption,
    setCaption,
    isSending,
    isDownloading,
    error,
    handleSend,
    handleDownloadPdf,
  } = useSendInvoiceWhatsapp({
    transactionId: transaction.id,
    defaultPhone: transaction.customer?.phone || "",
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (transaction.customer?.phone) {
      setPhoneNumber(transaction.customer.phone);
    }
  }, [transaction.customer?.phone, setPhoneNumber]);

  const customerName = transaction.customer?.name || "Pelanggan Umum";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Kirim Struk via WhatsApp
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {transaction.transactionNumber}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          <div className="bg-muted/40 p-3 rounded-lg border space-y-1">
            <div className="text-xs text-muted-foreground">Penerima Transaksi</div>
            <div className="font-medium text-foreground">{customerName}</div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-number" className="text-xs font-semibold">
              Nomor WhatsApp Tujuan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsapp-number"
              type="tel"
              placeholder="081234567890 atau 6281234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSending}
              className="font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Nomor format lokal (08xx) akan otomatis dinormalisasi ke format internasional (628xx).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="whatsapp-caption" className="text-xs font-semibold">
              Pesan Tambahan (Opsional)
            </Label>
            <Textarea
              id="whatsapp-caption"
              rows={3}
              placeholder="Kosongkan untuk menggunakan pesan pengantar standar Nyenyak."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isSending}
              className="text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4 text-primary" />
              <span>Lampiran Struk Digital PDF</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleDownloadPdf}
              disabled={isDownloading || isSending}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Mengunduh...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-1" />
                  Unduh Struk
                </>
              )}
            </Button>
          </div>

          {error && <div className="text-xs text-destructive font-medium">{error}</div>}
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Tutup
          </Button>

          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengirim WhatsApp...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Kirim Struk WhatsApp
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

