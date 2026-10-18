"use server"

import { ReportService } from "../services/report-service"
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service"

export async function getProfitAndLossAction(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const data = await ReportService.generateProfitAndLoss(options)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate Profit and Loss report."
    return { error: message }
  }
}

export async function getBalanceSheetAction(options: { asOfDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const data = await ReportService.generateBalanceSheet(options)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate Balance Sheet."
    return { error: message }
  }
}

export async function getTrialBalanceAction(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const data = await ReportService.generateTrialBalance(options)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate Trial Balance."
    return { error: message }
  }
}

export async function getDailyReportAction(date: Date, branchId?: string, tenantId?: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth()
    if (!authCheck.success) {
      return { error: authCheck.error }
    }

    const data = await ReportService.generateDailyReport(date, branchId, tenantId)
    return { success: true, data }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate Daily Report."
    return { error: message }
  }
}
