"use client";

import { useState, useMemo } from "react";
import { isToday } from "date-fns";
import { Search, X, Activity, CalendarCheck, Clock, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { SidebarSessionCard } from "./sidebar-session-card";
import { SidebarBookingCard } from "./sidebar-booking-card";
import { SidebarResourcesTab } from "./sidebar-resources-tab";
import { useTimetableStore } from "../../stores/timetable-store";

interface TimetableSidebarProps {
  isOpen: boolean;
}

export function TimetableSidebar({ isOpen }: TimetableSidebarProps) {
  const { sessions, pendingBookings, rooms, handleProcessBooking } = useTimetableStore();

  const [activeTab, setActiveTab] = useState("sesi");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<string>("ALL");

  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState<string>("ALL");

  // Summary counts
  const inProgressCount = useMemo(
    () => sessions.filter((s) => s.status === "IN_PROGRESS").length,
    [sessions]
  );
  const scheduledCount = useMemo(
    () => sessions.filter((s) => s.status === "SCHEDULED").length,
    [sessions]
  );
  const completedCount = useMemo(
    () => sessions.filter((s) => s.status === "COMPLETED").length,
    [sessions]
  );
  const pendingPaymentCount = useMemo(
    () => sessions.filter((s) => s.paymentStatus === "PENDING").length,
    [sessions]
  );

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Status filter
      if (sessionStatusFilter === "IN_PROGRESS" && session.status !== "IN_PROGRESS") return false;
      if (sessionStatusFilter === "SCHEDULED" && session.status !== "SCHEDULED") return false;
      if (sessionStatusFilter === "COMPLETED" && session.status !== "COMPLETED") return false;
      if (sessionStatusFilter === "PENDING_PAYMENT" && session.paymentStatus !== "PENDING") return false;

      // Search filter
      if (sessionSearch.trim()) {
        const query = sessionSearch.toLowerCase();
        const room = rooms.find((r: any) => r.id === session.roomId);
        const matchCustomer = session.customerName?.toLowerCase().includes(query);
        const matchPhone = session.customerPhone?.toLowerCase().includes(query);
        const matchItem = session.itemName?.toLowerCase().includes(query);
        const matchStaff = session.staff?.firstName?.toLowerCase().includes(query);
        const matchRoom = room?.name?.toLowerCase().includes(query);
        const matchBooking = session.bookingNumber?.toLowerCase().includes(query);

        return matchCustomer || matchPhone || matchItem || matchStaff || matchRoom || matchBooking;
      }

      return true;
    });
  }, [sessions, sessionStatusFilter, sessionSearch, rooms]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    if (!pendingBookings) return [];
    return pendingBookings.filter((booking) => {
      // Filter tab
      if (bookingFilter === "TODAY") {
        if (!booking.scheduledStartTime) return false;
        if (!isToday(new Date(booking.scheduledStartTime))) return false;
      }
      if (bookingFilter === "UNASSIGNED" && booking.isAssignedToTimetable) {
        return false;
      }

      // Search
      if (bookingSearch.trim()) {
        const query = bookingSearch.toLowerCase();
        const name = (booking.customer?.name || booking.customerName || "").toLowerCase();
        const phone = (booking.customer?.phone || booking.customerPhone || "").toLowerCase();
        const number = (booking.bookingNumber || "").toLowerCase();
        const items = (booking.items || []).some((it: any) =>
          it.itemNameSnapshot?.toLowerCase().includes(query)
        );

        return name.includes(query) || phone.includes(query) || number.includes(query) || items;
      }

      return true;
    });
  }, [pendingBookings, bookingFilter, bookingSearch]);

  if (!isOpen) return null;

  return (
    <div className="w-88 shrink-0 bg-background border-l border-border flex flex-col h-full overflow-hidden">
      {/* Top Operations KPI Pulse */}
      <div className="p-3 border-b border-border bg-muted/20 shrink-0">
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-card p-1.5 rounded-lg border border-border/80">
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold text-foreground font-mono">{inProgressCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Aktif</span>
          </div>

          <div className="bg-card p-1.5 rounded-lg border border-border/80">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground font-mono">{scheduledCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Terjadwal</span>
          </div>

          <div className="bg-card p-1.5 rounded-lg border border-border/80">
            <div className="flex items-center justify-center gap-1">
              <CalendarCheck className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground font-mono">{pendingBookings?.length || 0}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Booking</span>
          </div>

          <div className="bg-card p-1.5 rounded-lg border border-border/80">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground font-mono">{completedCount}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block truncate">Selesai</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="p-2 border-b border-border shrink-0 bg-background">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="sesi" className="text-xs">
              Sesi ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="booking" className="text-xs">
              Booking
              {pendingBookings?.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1.5 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] rounded-full"
                >
                  {pendingBookings.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ketersediaan" className="text-xs">
              Ketersediaan
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Sesi */}
        <TabsContent
          value="sesi"
          className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex flex-col"
        >
          {/* Search & Filter pills */}
          <div className="p-2.5 border-b border-border bg-background/50 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Cari tamu, terapis, ruangan..."
                className="pl-8 pr-7 text-xs h-7.5"
              />
              {sessionSearch && (
                <button
                  type="button"
                  onClick={() => setSessionSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSessionStatusFilter("ALL")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  sessionStatusFilter === "ALL"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({sessions.length})
              </button>
              <button
                type="button"
                onClick={() => setSessionStatusFilter("IN_PROGRESS")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  sessionStatusFilter === "IN_PROGRESS"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Aktif ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setSessionStatusFilter("SCHEDULED")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  sessionStatusFilter === "SCHEDULED"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Terjadwal ({scheduledCount})
              </button>
              {pendingPaymentCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSessionStatusFilter("PENDING_PAYMENT")}
                  className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                    sessionStatusFilter === "PENDING_PAYMENT"
                      ? "bg-destructive text-destructive-foreground font-semibold"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  }`}
                >
                  Belum Bayar ({pendingPaymentCount})
                </button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-2.5 p-3 pb-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-10 space-y-1">
                  <p className="font-medium">Tidak ada sesi ditemukan</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {sessionSearch
                      ? "Coba gunakan kata kunci pencarian lain"
                      : "Belum ada sesi untuk filter yang dipilih"}
                  </p>
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <SidebarSessionCard key={session.id} session={session} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab 2: Booking */}
        <TabsContent
          value="booking"
          className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex flex-col"
        >
          {/* Search & Filter pills */}
          <div className="p-2.5 border-b border-border bg-background/50 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Cari kode booking, nama tamu..."
                className="pl-8 pr-7 text-xs h-7.5"
              />
              {bookingSearch && (
                <button
                  type="button"
                  onClick={() => setBookingSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setBookingFilter("ALL")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  bookingFilter === "ALL"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Semua ({pendingBookings?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter("TODAY")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  bookingFilter === "TODAY"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setBookingFilter("UNASSIGNED")}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                  bookingFilter === "UNASSIGNED"
                    ? "bg-foreground text-background font-semibold"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Belum Ditugaskan
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-2.5 p-3 pb-4">
              {filteredBookings.length === 0 ? (
                <div className="text-center text-muted-foreground text-xs py-10 space-y-1">
                  <p className="font-medium">Tidak ada booking masuk</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Semua booking telah diproses atau sesuai filter
                  </p>
                </div>
              ) : (
                filteredBookings.map((booking) => (
                  <SidebarBookingCard
                    key={booking.id}
                    booking={booking}
                    onProcessBooking={handleProcessBooking}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tab 3: Ketersediaan (Resource Availability) */}
        <TabsContent
          value="ketersediaan"
          className="flex-1 min-h-0 overflow-hidden m-0 data-[state=active]:flex flex-col"
        >
          <SidebarResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
