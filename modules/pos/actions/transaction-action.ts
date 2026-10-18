"use server"

import { TransactionService, TransactionFilterInput } from "../services/transaction-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function getBranchTransactionsAction(filters: TransactionFilterInput) {
  try {
    await AuthGuardService.requireAuth();
    const result = await TransactionService.getBranchTransactions(filters);
    return {
      success: true,
      data: result.data,
      summary: result.summary,
      pagination: { total: result.total, page: result.page, totalPages: result.totalPages }
    };
  } catch (error: unknown) {
    console.error("Failed to fetch branch transactions:", error);
    const message = error instanceof Error ? error.message : "An error occurred while fetching transactions.";
    return { error: message };
  }
}
