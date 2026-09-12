"use server"

import { posCheckoutSchema, type PosCheckoutInput } from "../schemas/pos-schema";
import { PosService } from "../services/pos-service";
import { auth } from "@/modules/auth/auth";
import { prisma } from "@/lib/prisma";

export async function createPosTransactionAction(values: PosCheckoutInput) {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const staffUser = await prisma.staffUser.findFirst({
        where: { userId: session.user.id }
      });
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

    return { success: true, transactionId: result.id };
  } catch (error: any) {
    console.error("POS Checkout Error:", error);
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
