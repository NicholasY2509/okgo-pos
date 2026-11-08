"use server"

import { posCheckoutSchema, type PosCheckoutInput } from "../schemas/pos-schema";
import { PosService } from "../services/pos-service";
import { auth } from "@/modules/auth/auth";
import { StaffUserService } from "@/modules/staff-user/services/staff-user-service";

export async function createPosTransactionAction(values: PosCheckoutInput) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const staffUser = await StaffUserService.findByUserId(session.user.id);
      if (staffUser) {
        values.cashierId = staffUser.staffId;
      }
    }

    const validatedFields = posCheckoutSchema.safeParse(values);
    if (!validatedFields.success) {
      console.error("ZOD VALIDATION ERROR in posCheckoutSchema:", JSON.stringify(validatedFields.error.flatten(), null, 2));
      return { error: "Invalid transaction data.", details: validatedFields.error.flatten() };
    }

    const result = await PosService.checkout(validatedFields.data);

    return {
      success: true,
      transactionId: result.id,
      transactionNumber: result.transactionNumber,
    };
  } catch (error: unknown) {
    console.error("POS Checkout Error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function payExistingTransactionAction(values: {
  transactionId: string;
  cashierId?: string | null;
  payments: {
    paymentMethodId: string;
    amount: number;
    referenceNumber?: string;
    voucherCode?: string;
    notes?: string;
  }[];
}) {
  try {
    const session = await auth();
    if (session?.user?.id && !values.cashierId) {
      const staffUser = await StaffUserService.findByUserId(session.user.id);
      if (staffUser) {
        values.cashierId = staffUser.staffId;
      }
    }

    const result = await PosService.payExistingTransaction(values);
    return { success: true, transactionId: result.id };
  } catch (error: unknown) {
    console.error("POS Pay Existing Error:", error);
    const message = error instanceof Error ? error.message : "Gagal memproses pembayaran.";
    return { error: message };
  }
}
