"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GlobalNotificationListenerProps {
  branchId: string;
}

export function GlobalNotificationListener({ branchId }: GlobalNotificationListenerProps) {
  const router = useRouter();

  useEffect(() => {
    const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);

    const handleStatusChanged = (data: any) => {
      const audio = new Audio("/notification.ogg");
      audio.play().catch(e => console.error("Error playing sound:", e));
      
      const isStart = data?.action === "start";
      const therapistName = data?.staffName || "seorang terapis";
      const serviceName = data?.serviceName || "Layanan";

      toast.info(isStart ? "Sesi layanan telah dimulai!" : "Sesi layanan telah berakhir!", {
        description: `${serviceName} oleh ${therapistName}.`,
        duration: 10000,
      });

      router.refresh();
    };

    const handleNewBooking = (data: any) => {
      if (data.branchId === branchId) {
        const audio = new Audio("/notification.ogg");
        audio.play().catch(e => console.error("Error playing sound:", e));
        toast.success(`Booking baru dari ${data.customerName}!`, {
          description: "Silakan cek halaman jadwal.",
          duration: 10000,
        });
        
        router.refresh();
      }
    };

    socket.on("service_status_changed", handleStatusChanged);
    socket.on("new_booking", handleNewBooking);

    return () => {
      socket.off("service_status_changed", handleStatusChanged);
      socket.off("new_booking", handleNewBooking);
      socket.disconnect();
    };
  }, [branchId, router]);

  return null;
}
