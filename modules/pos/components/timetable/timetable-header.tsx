"use client";

import { addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminBookingForm } from "../../../booking/components/admin-booking-form";
import { useTimetableStore } from "../../stores/timetable-store";

interface TimetableHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export function TimetableHeader({ isSidebarOpen, setIsSidebarOpen }: TimetableHeaderProps) {
  const {
    branchId,
    date,
    setDate,
    isBookingModalOpen,
    setIsBookingModalOpen,
    fetchSessions,
  } = useTimetableStore();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <a href={`/pos`}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Kembali ke POS
          </a>
        </Button>
        <h2 className="text-xl font-bold tracking-tight">Jadwal Ruangan</h2>
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
          <DialogTrigger asChild>
            <Button className="mr-2">
              <Plus className="w-4 h-4 mr-2" />
              Buat Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Buat Booking Baru</DialogTitle>
            </DialogHeader>
            {branchId && (
              <AdminBookingForm
                branchId={branchId}
                onSuccess={() => {
                  setIsBookingModalOpen(false);
                  fetchSessions();
                }}
                onCancel={() => setIsBookingModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="icon" onClick={() => setDate(subDays(date, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <DatePicker
          date={date}
          setDate={(d) => d && setDate(d)}
          className="w-60"
        />
        <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="default" onClick={() => setDate(new Date())} className="ml-2">
          Hari Ini
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="ml-2">
          {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
