import { AttendanceLogRepository, GetLogsParams } from "../repositories/attendance-log-repository"

export class AttendanceLogService {
  static async getLogs(params: GetLogsParams) {
    return await AttendanceLogRepository.getLogs(params)
  }
}
