"use client";

import { useState } from "react";
import { SessionInfoDialog } from "./timetable/session-info-dialog";
import { ExistingTransactionPaymentModal } from "./existing-payment-modal";
import { TimetableSidebar } from "./timetable/timetable-sidebar";
import { TimetableHeader } from "./timetable/timetable-header";
import { TimetableGrid } from "./timetable/timetable-grid";
import { AssignBookingModal } from "./timetable/assign-booking-modal";
import { useEffect } from "react";
import { useTimetableStore } from "../stores/timetable-store";
import { io } from "socket.io-client";
import { toast } from "sonner";

interface TimetableClientProps {
  branchId: string;
  rooms: any[];
  paymentMethods: any[];
  staff: any[];
  brandSetting?: any;
}

export function TimetableClient({ branchId, rooms, paymentMethods, staff, brandSetting }: TimetableClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    setInitialData,
    fetchSessions,
    fetchPendingBookings,
    selectedSessionForInfo,
    setSelectedSessionForInfo,
    setSelectedTransactionForPayment,
  } = useTimetableStore();

  useEffect(() => {
    setInitialData({ branchId, rooms, paymentMethods, staff, brandSetting });
    fetchSessions();
    fetchPendingBookings();

    const interval = setInterval(() => {
      fetchSessions();
      fetchPendingBookings();
    }, 60000);

    const socket = io(process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);

    const handleStatusChanged = (data: any) => {
      fetchSessions();
      fetchPendingBookings();
    };

    const handleNewBooking = (data: any) => {
      if (data.branchId === branchId) {
        fetchSessions();
        fetchPendingBookings();
      }
    };

    socket.on("service_status_changed", handleStatusChanged);
    socket.on("new_booking", handleNewBooking);

    return () => {
      clearInterval(interval);
      socket.off("service_status_changed", handleStatusChanged);
      socket.off("new_booking", handleNewBooking);
      socket.disconnect();
    };
  }, [branchId, rooms, paymentMethods, staff, brandSetting, fetchSessions, fetchPendingBookings, setInitialData]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <TimetableHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gantt Chart Area */}
        <TimetableGrid />

        <TimetableSidebar
          isOpen={isSidebarOpen}
        />
      </div>

      <SessionInfoDialog
        open={!!selectedSessionForInfo}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionForInfo(null);
        }}
        session={selectedSessionForInfo}
        onPayNow={() => {
          if (selectedSessionForInfo?.transactionItem?.transaction) {
            setSelectedTransactionForPayment(selectedSessionForInfo.transactionItem.transaction);
          }
        }}
        staff={staff}
      />

      <ExistingTransactionPaymentModal />
      <AssignBookingModal />
    </div>
  );
}

