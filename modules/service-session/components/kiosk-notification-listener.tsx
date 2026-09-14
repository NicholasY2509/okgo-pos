"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface KioskNotificationListenerProps {
  staffId: string;
}

export function KioskNotificationListener({ staffId }: KioskNotificationListenerProps) {
  const [socket, setSocket] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Connect to the socket server
    const newSocket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleServiceAssigned = (data: any) => {
      // Check if this assignment is for the current therapist
      if (data.staffId === staffId) {
        // Play sound
        const audio = new Audio("/notification.ogg");
        audio.play().catch(e => console.error("Error playing sound:", e));

        // Show toast
        toast.success("Layanan Baru Ditugaskan!", {
          description: data.serviceName ? `Anda telah ditugaskan untuk layanan: ${data.serviceName}` : "Silakan cek antrean Anda.",
          duration: 10000, // 10 seconds
        });

        // Refresh the page data to show the new session in the list
        router.refresh();
      }
    };

    socket.on("service_assigned", handleServiceAssigned);

    return () => {
      socket.off("service_assigned", handleServiceAssigned);
    };
  }, [socket, staffId]);

  return null; // This component doesn't render anything visible
}
