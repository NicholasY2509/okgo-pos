"use server"

import { TransactionService, TransactionFilterInput } from "../services/transaction-service";

export async function getBranchTransactionsAction(filters: TransactionFilterInput) {
  try {
    const result = await TransactionService.getBranchTransactions(filters);
    return {
      success: true,
      data: result.data,
      summary: result.summary,
      pagination: { total: result.total, page: result.page, totalPages: result.totalPages }
    };
  } catch (error: any) {
    console.error("Failed to fetch branch transactions:", error);
    return { error: error.message || "An error occurred while fetching transactions." };
  }
}
