export interface StaffCurrentSessionInfo {
  serviceName: string
  roomName: string
  customerName: string
  startTime?: string
  endTime?: string
}

export interface StaffNextSessionInfo {
  serviceName: string
  roomName: string
  startTime: string
}

export interface StaffActivityStatus {
  isBusy: boolean
  status: "BUSY" | "AVAILABLE"
  currentSession?: StaffCurrentSessionInfo
  nextSession?: StaffNextSessionInfo
}

export interface StaffTodayAttendance {
  status: string
  statusCode: string
  clockIn?: string
  clockOut?: string
  shiftName?: string
  shiftHours?: string
}

export interface StaffAttendanceRecap {
  present: number
  late: number
  leave: number
  absent: number
  totalDays: number
  rate: number
}

export interface BranchStaffHrisItem {
  id: string
  name: string
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  staffIdNumber?: string | null
  imageUrl?: string | null
  position: string
  role: string
  activity: StaffActivityStatus
  todayAttendance: StaffTodayAttendance
  attendanceRecap: StaffAttendanceRecap
}

export interface BranchHrisSummary {
  totalStaff: number
  busyCount: number
  availableCount: number
  presentTodayCount: number
}
