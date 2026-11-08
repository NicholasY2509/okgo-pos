"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getWhatsappStatusAction,
  connectWhatsappAction,
  logoutWhatsappAction,
  restartWhatsappAction,
  sendWhatsappTestMessageAction,
} from "../actions/whatsapp-pairing-action";
import type { WhatsappConnectionInfo, ConnectResult } from "../services/whatsapp-pairing-service";

export function useWhatsappPairing(
  initialStatus?: WhatsappConnectionInfo,
  targetInstanceName?: string
) {
  const [status, setStatus] = useState<WhatsappConnectionInfo | null>(initialStatus || null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(!initialStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [qrCodeData, setQrCodeData] = useState<ConnectResult | null>(null);
  const [phoneNumberInput, setPhoneNumberInput] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Halo, ini adalah pesan uji coba dari sistem Nyenyak POS.");

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoadingStatus(true);
    try {
      const res = await getWhatsappStatusAction(targetInstanceName);
      if (res.success && res.data) {
        setStatus(res.data);
        if (res.data.connected) {
          setQrCodeData(null);
        }
      } else if (!quiet) {
        toast.error(res.error || "Gagal mengambil status WhatsApp.");
      }
    } catch {
      if (!quiet) toast.error("Terjadi kesalahan saat memeriksa status.");
    } finally {
      if (!quiet) setIsLoadingStatus(false);
    }
  }, [targetInstanceName]);

  // Fetch initial status if not provided or when targetInstanceName changes
  useEffect(() => {
    fetchStatus();
  }, [targetInstanceName, fetchStatus]);

  // Handle active polling while waiting for QR scan or pairing
  useEffect(() => {
    if (qrCodeData && !status?.connected) {
      pollTimerRef.current = setInterval(() => {
        fetchStatus(true);
      }, 4000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [qrCodeData, status?.connected, fetchStatus]);

  const handleConnect = async (phone?: string) => {
    setIsConnecting(true);
    try {
      const res = await connectWhatsappAction({
        instanceName: targetInstanceName,
        phoneNumber: phone || undefined,
      });
      if (res.success && res.data) {
        if (res.data.connected) {
          toast.success("WhatsApp sudah dalam keadaan terhubung.");
          await fetchStatus();
        } else {
          setQrCodeData(res.data);
          toast.info(res.data.pairingCode ? "Kode pairing berhasil digenerate." : "QR code berhasil dimuat.");
        }
      } else {
        toast.error(res.error || "Gagal menghubungkan WhatsApp.");
      }
    } catch {
      toast.error("Gagal menghubungkan WhatsApp.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const res = await logoutWhatsappAction(targetInstanceName);
      if (res.success) {
        toast.success(res.data?.message || "WhatsApp berhasil diputuskan.");
        setQrCodeData(null);
        await fetchStatus();
      } else {
        toast.error(res.error || "Gagal memutuskan sambungan WhatsApp.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memutuskan sambungan.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRestart = async () => {
    setIsConnecting(true);
    try {
      const res = await restartWhatsappAction(targetInstanceName);
      if (res.success) {
        toast.success(res.data?.message || "Instance berhasil di-restart.");
        await fetchStatus();
      } else {
        toast.error(res.error || "Gagal me-restart instance.");
      }
    } catch {
      toast.error("Gagal me-restart instance.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error("Masukkan nomor tujuan untuk pesan uji coba.");
      return;
    }
    if (!testMessage.trim()) {
      toast.error("Masukkan pesan teks.");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendWhatsappTestMessageAction({
        instanceName: targetInstanceName,
        phoneNumber: testPhone.trim(),
        message: testMessage.trim(),
      });

      if (res.success) {
        toast.success(`Pesan uji coba berhasil dikirim ke ${testPhone}!`);
      } else {
        toast.error(res.error || "Gagal mengirim pesan uji coba.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim pesan uji coba.");
    } finally {
      setIsSendingTest(false);
    }
  };

  return {
    status,
    isLoadingStatus,
    isConnecting,
    isLoggingOut,
    isSendingTest,
    qrCodeData,
    phoneNumberInput,
    setPhoneNumberInput,
    testPhone,
    setTestPhone,
    testMessage,
    setTestMessage,
    handleConnect,
    handleLogout,
    handleRestart,
    handleSendTestMessage,
    refreshStatus: () => fetchStatus(false),
  };
}

