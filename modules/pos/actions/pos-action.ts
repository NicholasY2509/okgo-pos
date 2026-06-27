"use server"

import { posCheckoutSchema, type PosCheckoutInput } from "../schemas/pos-schema";
import { PosService } from "../services/pos-service";

export async function createPosTransactionAction(values: PosCheckoutInput) {
  try {
    const validatedFields = posCheckoutSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid transaction data.", details: validatedFields.error.flatten() };
    }

    const result = await PosService.checkout(validatedFields.data);

    // We can't return complex Prisma objects with Decimals directly to the client sometimes,
    // so we might need to stringify or let Next.js handle it (Next 15 handles simple dates/objects, 
    // but Decimal might need conversion. Assuming Next 15 handles it or we map it if error occurs).
    // Let's just return success for now.
    return { success: true, transactionId: result.id };
  } catch (error: any) {
    console.error("POS Checkout Error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function createDirectRedemptionAction(values: any) {
  try {
    const result = await PosService.directRedeem(values);
    return { success: true, transactionId: result.id };
  } catch (error: any) {
    console.error("POS Direct Redeem Error:", error);
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function payExistingTransactionAction(values: {
  transactionId: string;
  payments: {
    paymentMethodId: string;
    amount: number;
    referenceNumber?: string;
    voucherCode?: string;
    notes?: string;
  }[];
}) {
  try {
    const result = await PosService.payExistingTransaction(values);
    return { success: true, transactionId: result.id };
  } catch (error: any) {
    console.error("POS Pay Existing Error:", error);
    return { error: error.message || "Gagal memproses pembayaran." };
  }
}
