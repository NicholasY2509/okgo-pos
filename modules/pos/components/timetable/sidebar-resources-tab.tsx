"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DoorClosed, User, Clock, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useTimetableStore } from "../../stores/timetable-store";

export function SidebarResourcesTab() {
  const { staff, rooms, sessions } = useTimetableStore();
  const [activeSegment, setActiveSegment] = useState<"staff" | "rooms">("staff");
  const [searchQuery, setSearchQuery] = useState("");

  const now = new Date();

  // Helper to determine if a session is currently active
  const isSessionCurrentlyActive = (s: any) => {
    if (s.status === "COMPLETED" || s.status === "CANCELLED") return false;
    if (s.status === "IN_PROGRESS") return true;
    if (!s.startTime || !s.endTime) return false;
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);
    return now >= start && now <= end;
  };

  // Staff calculations
  const staffStatusList = staff.map((st: any) => {
    const fullName = [st.firstName, st.lastName].filter(Boolean).join(" ") || st.name || "Terapis";
    // Find active session
    const currentSession = sessions.find((s: any) => s.staffId === st.id && isSessionCurrentlyActive(s));

    // Find next session today
    const upcomingSessions = sessions
      .filter((s: any) => s.staffId === st.id && s.status === "SCHEDULED" && s.startTime && new Date(s.startTime) > now)
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const nextSession = upcomingSessions[0] || null;

    const room = currentSession ? rooms.find((r: any) => r.id === currentSession.roomId) : null;

    let remainingMinutes: number | null = null;
    if (currentSession && currentSession.endTime) {
      remainingMinutes = Math.round((new Date(currentSession.endTime).getTime() - now.getTime()) / 60000);
    }

    return {
      id: st.id,
      name: fullName,
      currentSession,
      roomName: room?.name || "Ruangan -",
      remainingMinutes,
      nextSession,
      isBusy: !!currentSession,
    };
  });

  // Room calculations
  const roomStatusList = rooms.map((rm: any) => {
    const currentSession = sessions.find((s: any) => s.roomId === rm.id && isSessionCurrentlyActive(s));

    const upcomingSessions = sessions
      .filter((s: any) => s.roomId === rm.id && s.status === "SCHEDULED" && s.startTime && new Date(s.startTime) > now)
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const nextSession = upcomingSessions[0] || null;

    let remainingMinutes: number | null = null;
    if (currentSession && currentSession.endTime) {
      remainingMinutes = Math.round((new Date(currentSession.endTime).getTime() - now.getTime()) / 60000);
    }

    return {
      id: rm.id,
      name: rm.name,
      currentSession,
      remainingMinutes,
      nextSession,
      isOccupied: !!currentSession,
    };
  });

  const filteredStaff = staffStatusList.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRooms = roomStatusList.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const busyStaffCount = staffStatusList.filter((s) => s.isBusy).length;
  const availableStaffCount = staffStatusList.length - busyStaffCount;

  const occupiedRoomCount = roomStatusList.filter((r) => r.isOccupied).length;
  const emptyRoomCount = roomStatusList.length - occupiedRoomCount;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Sub-tabs & Search */}
      <div className="p-3 border-b border-border space-y-2 shrink-0 bg-background/50">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted rounded-lg text-xs font-medium">
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === "staff"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveSegment("staff")}
          >
            <User className="w-3.5 h-3.5" />
            <span>Terapis ({staff.length})</span>
          </button>
          <button
            type="button"
            className={`py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeSegment === "rooms"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveSegment("rooms")}
          >
            <DoorClosed className="w-3.5 h-3.5" />
            <span>Ruangan ({rooms.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeSegment === "staff" ? "Cari nama terapis..." : "Cari nama ruangan..."}
            className="pl-8 text-xs h-7.5"
          />
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          {activeSegment === "staff" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {availableStaffCount} Siap / Bebas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {busyStaffCount} Sedang Bertugas
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                {emptyRoomCount} Ruangan Kosong
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {occupiedRoomCount} Ruangan Terisi
              </span>
            </>
          )}
        </div>
      </div>

      {/* List content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 p-3 pb-4">
          {activeSegment === "staff" ? (
            filteredStaff.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                Tidak ada data terapis ditemukan.
              </div>
            ) : (
              filteredStaff.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-medium shrink-0 ${
                        item.isBusy
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {item.isBusy ? "Sibuk" : "Tersedia"}
                    </Badge>
                  </div>

                  {item.isBusy && item.currentSession ? (
                    <div className="bg-muted/40 rounded-lg p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-foreground font-medium">
                        <span className="truncate">{item.currentSession.itemName}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                          {item.roomName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sampai {item.currentSession.endTime ? format(new Date(item.currentSession.endTime), "HH:mm") : "--:--"}
                        </span>
                        {item.remainingMinutes !== null && (
                          <span className={item.remainingMinutes <= 5 ? "text-amber-500 font-medium" : "text-muted-foreground"}>
                            {item.remainingMinutes > 0 ? `Sisa ${item.remainingMinutes} mnt` : "Waktu habis"}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : item.nextSession ? (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                      <span>Jadwal berikutnya:</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(item.nextSession.startTime), "HH:mm")} ({item.nextSession.itemName})
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/70 px-1 italic">
                      Tidak ada jadwal lanjutan hari ini
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            filteredRooms.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                Tidak ada data ruangan ditemukan.
              </div>
            ) : (
              filteredRooms.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-border bg-card/60 hover:bg-card transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <DoorClosed className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 font-medium shrink-0 ${
                        item.isOccupied
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {item.isOccupied ? "Terisi" : "Kosong"}
                    </Badge>
                  </div>

                  {item.isOccupied && item.currentSession ? (
                    <div className="bg-muted/40 rounded-lg p-2 text-xs space-y-1">
                      <div className="flex items-center justify-between text-foreground font-medium">
                        <span className="truncate">{item.currentSession.itemName}</span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {item.currentSession.customerName || "Tamu"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {item.currentSession.staff?.firstName || "Tanpa Terapis"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.remainingMinutes !== null && item.remainingMinutes > 0
                            ? `Sisa ${item.remainingMinutes} mnt`
                            : "Selesai"}
                        </span>
                      </div>
                    </div>
                  ) : item.nextSession ? (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                      <span>Jadwal berikutnya:</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(item.nextSession.startTime), "HH:mm")}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground/70 px-1 italic">
                      Kosong untuk sisa hari ini
                    </div>
                  )}
                </div>
              ))
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
