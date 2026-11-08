"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  sendInvoiceWhatsappAction,
  getInvoicePdfBase64Action,
} from "../actions/invoice-whatsapp-action";

interface UseSendInvoiceWhatsappProps {
  transactionId: string;
  defaultPhone?: string | null;
  onSuccess?: () => void;
}

export function useSendInvoiceWhatsapp({
  transactionId,
  defaultPhone,
  onSuccess,
}: UseSendInvoiceWhatsappProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone || "");
  const [caption, setCaption] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Nomor WhatsApp tujuan wajib diisi.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const res = await sendInvoiceWhatsappAction({
        transactionId,
        phoneNumber: phoneNumber.trim(),
        caption: caption.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(`Invoice PDF berhasil dikirim ke WhatsApp ${res.data?.recipient || phoneNumber}`);
        onSuccess?.();
      }
    } catch {
      const msg = "Terjadi kesalahan saat mengirim invoice WhatsApp.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await getInvoicePdfBase64Action(transactionId);
      if (res.error || !res.data) {
        toast.error(res.error || "Gagal mengunduh invoice PDF.");
      } else {
        const { base64, fileName } = res.data;
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Invoice PDF berhasil diunduh.");
      }
    } catch {
      toast.error("Gagal mengunduh invoice PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    phoneNumber,
    setPhoneNumber,
    caption,
    setCaption,
    isSending,
    isDownloading,
    error,
    handleSend,
    handleDownloadPdf,
  };
}

