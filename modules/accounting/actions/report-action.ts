"use server"

import { ReportService } from "../services/report-service"

export async function getProfitAndLossAction(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const data = await ReportService.generateProfitAndLoss(options)
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || "Failed to generate Profit and Loss report." }
  }
}

export async function getBalanceSheetAction(options: { asOfDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const data = await ReportService.generateBalanceSheet(options)
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || "Failed to generate Balance Sheet." }
  }
}

export async function getTrialBalanceAction(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const data = await ReportService.generateTrialBalance(options)
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || "Failed to generate Trial Balance." }
  }
}

export async function getDailyReportAction(date: Date, branchId?: string, tenantId?: string) {
  try {
    const data = await ReportService.generateDailyReport(date, branchId, tenantId)
    return { success: true, data }
  } catch (error: any) {
    return { error: error.message || "Failed to generate Daily Report." }
  }
}
