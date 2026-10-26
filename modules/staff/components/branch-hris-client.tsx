"use client"

import { useState, useMemo } from "react"
import { BranchStaffHrisItem } from "../types/hris-types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  UserCheck,
  Activity,
  Coffee,
  Search,
  Clock,
  Sparkles,
  MapPin,
  CalendarCheck,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { format } from "date-fns"

interface BranchHrisClientProps {
  branchName: string
  branchSubdomain: string
  staffList: BranchStaffHrisItem[]
}

type StatusFilter = "ALL" | "BUSY" | "AVAILABLE" | "PRESENT_TODAY"

export function BranchHrisClient({
  branchName,
  branchSubdomain,
  staffList,
}: BranchHrisClientProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [positionFilter, setPositionFilter] = useState<string>("ALL")

  // Extract unique positions
  const positions = useMemo(() => {
    const set = new Set<string>()
    for (const s of staffList) {
      if (s.position) set.add(s.position)
    }
    return Array.from(set).sort()
  }, [staffList])

  // Aggregate metrics
  const summary = useMemo(() => {
    const totalStaff = staffList.length
    const busyCount = staffList.filter((s) => s.activity.isBusy).length
    const availableCount = staffList.filter((s) => !s.activity.isBusy).length
    const presentTodayCount = staffList.filter(
      (s) =>
        s.todayAttendance.statusCode === "H" ||
        s.todayAttendance.statusCode === "PRESENT" ||
        s.todayAttendance.statusCode === "T" ||
        s.todayAttendance.statusCode === "LATE" ||
        Boolean(s.todayAttendance.clockIn)
    ).length

    return {
      totalStaff,
      busyCount,
      availableCount,
      presentTodayCount,
    }
  }, [staffList])

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Search filter
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.position.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase()) ||
        (s.staffIdNumber &&
          s.staffIdNumber.toLowerCase().includes(search.toLowerCase()))

      // Status filter
      let matchesStatus = true
      if (statusFilter === "BUSY") {
        matchesStatus = s.activity.isBusy
      } else if (statusFilter === "AVAILABLE") {
        matchesStatus = !s.activity.isBusy
      } else if (statusFilter === "PRESENT_TODAY") {
        matchesStatus =
          s.todayAttendance.statusCode === "H" ||
          s.todayAttendance.statusCode === "PRESENT" ||
          s.todayAttendance.statusCode === "T" ||
          s.todayAttendance.statusCode === "LATE" ||
          Boolean(s.todayAttendance.clockIn)
      }

      // Position filter
      const matchesPosition =
        positionFilter === "ALL" || s.position === positionFilter

      return matchesSearch && matchesStatus && matchesPosition
    })
  }, [staffList, search, statusFilter, positionFilter])

  // Helper for initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  // Format time (HH:mm)
  const formatTimeOnly = (isoString?: string) => {
    if (!isoString) return "-"
    try {
      return format(new Date(isoString), "HH:mm") + " WIB"
    } catch {
      return "-"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Karyawan
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {summary.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Karyawan aktif di cabang {branchName}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sedang Melayani
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold font-mono text-amber-600">
                {summary.busyCount}
              </div>
              {summary.busyCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sedang aktif dalam sesi treatment
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tersedia (Standby)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Coffee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {summary.availableCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Siap menerima tamu atau pesanan
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kehadiran Hari Ini
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {summary.presentTodayCount} / {summary.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tercatat clock-in hari ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Status Tabs */}
          <div className="inline-flex items-center rounded-lg bg-muted p-1 text-muted-foreground text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                statusFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              Semua ({summary.totalStaff})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("BUSY")}
              className={`rounded-md px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                statusFilter === "BUSY"
                  ? "bg-background text-amber-600 shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Sedang Sibuk ({summary.busyCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("AVAILABLE")}
              className={`rounded-md px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                statusFilter === "AVAILABLE"
                  ? "bg-background text-emerald-600 shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Tersedia ({summary.availableCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PRESENT_TODAY")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                statusFilter === "PRESENT_TODAY"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              Hadir ({summary.presentTodayCount})
            </button>
          </div>

          {/* Position Selector */}
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Pilih Posisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Posisi</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Staff Roster Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/40 font-medium grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="col-span-12 sm:col-span-3">Karyawan</div>
          <div className="col-span-6 sm:col-span-2">Posisi & Peran</div>
          <div className="col-span-12 sm:col-span-3">Aktivitas Saat Ini</div>
          <div className="col-span-6 sm:col-span-2">Kehadiran Hari Ini</div>
          <div className="col-span-6 sm:col-span-2 text-right">Rekap Bulan Ini</div>
        </div>

        <div className="divide-y">
          {filteredStaff.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
              <AlertCircle className="h-8 w-8 text-muted-foreground/60" />
              <span>Tidak ada karyawan yang sesuai dengan filter pencarian.</span>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const { activity, todayAttendance, attendanceRecap } = staff

              return (
                <div
                  key={staff.id}
                  className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors text-sm"
                >
                  {/* 1. Karyawan Profile */}
                  <div className="col-span-12 sm:col-span-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      {staff.imageUrl && (
                        <AvatarImage src={staff.imageUrl} alt={staff.name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {getInitials(staff.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate">
                        {staff.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                        <span>{staff.staffIdNumber || "Staff"}</span>
                        {staff.phone && (
                          <>
                            <span>·</span>
                            <span className="truncate">{staff.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Posisi & Peran */}
                  <div className="col-span-6 sm:col-span-2 flex flex-col gap-1 items-start">
                    <Badge variant="secondary" className="font-medium text-xs">
                      {staff.position}
                    </Badge>
                    <span className="text-xs text-muted-foreground pl-0.5">
                      {staff.role}
                    </span>
                  </div>

                  {/* 3. Aktivitas Saat Ini */}
                  <div className="col-span-12 sm:col-span-3">
                    {activity.isBusy && activity.currentSession ? (
                      <div className="flex flex-col gap-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Melayani Tamu (Sibuk)
                          </span>
                        </div>
                        <div className="text-xs font-medium text-foreground truncate">
                          {activity.currentSession.serviceName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.currentSession.roomName}
                          </span>
                          <span>·</span>
                          <span className="truncate">
                            {activity.currentSession.customerName}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            Tersedia (Standby)
                          </span>
                        </div>
                        {activity.nextSession ? (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              Sesi: {formatTimeOnly(activity.nextSession.startTime)} · {activity.nextSession.roomName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Belum ada jadwal sesi berikutnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. Kehadiran Hari Ini */}
                  <div className="col-span-6 sm:col-span-2 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${
                          todayAttendance.statusCode === "H" ||
                          todayAttendance.statusCode === "PRESENT"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : todayAttendance.statusCode === "T" ||
                              todayAttendance.statusCode === "LATE"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : todayAttendance.clockIn
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {todayAttendance.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex flex-col gap-0.5 font-mono">
                      {todayAttendance.clockIn ? (
                        <span>Masuk: {formatTimeOnly(todayAttendance.clockIn)}</span>
                      ) : (
                        <span className="text-muted-foreground/70">Belum clock-in</span>
                      )}
                      {todayAttendance.clockOut && (
                        <span>Pulang: {formatTimeOnly(todayAttendance.clockOut)}</span>
                      )}
                    </div>
                  </div>

                  {/* 5. Rekap Kehadiran Bulan Ini */}
                  <div className="col-span-6 sm:col-span-2 flex flex-col items-end gap-1 text-right">
                    <Badge
                      variant="outline"
                      className={`text-xs font-semibold ${
                        attendanceRecap.rate >= 90
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                          : attendanceRecap.rate >= 75
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          : "bg-destructive/10 text-destructive border-destructive/30"
                      }`}
                    >
                      {attendanceRecap.rate}% Kehadiran
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
                      <span title="Hadir" className="text-emerald-600 font-medium">
                        H:{attendanceRecap.present}
                      </span>
                      <span>·</span>
                      <span title="Terlambat" className="text-amber-600 font-medium">
                        T:{attendanceRecap.late}
                      </span>
                      <span>·</span>
                      <span title="Izin/Cuti/Sakit" className="text-blue-600">
                        I:{attendanceRecap.leave}
                      </span>
                      <span>·</span>
                      <span title="Absen" className="text-destructive font-medium">
                        A:{attendanceRecap.absent}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/70">
                      Total: {attendanceRecap.totalDays} hari kerja
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
