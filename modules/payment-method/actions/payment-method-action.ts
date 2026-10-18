"use server";

import { revalidatePath } from "next/cache";
import { paymentMethodSchema, type PaymentMethodInput } from "../schemas/payment-method-schema";
import { PaymentMethodService } from "../services/payment-method-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function createPaymentMethodAction(values: PaymentMethodInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = paymentMethodSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PaymentMethodService.create(validatedFields.data);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function updatePaymentMethodAction(id: string, values: PaymentMethodInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = paymentMethodSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PaymentMethodService.update(id, validatedFields.data);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await PaymentMethodService.delete(id);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}

export async function getActivePaymentMethodsAction() {
  try {
    const authCheck = await AuthGuardService.requireAuth();
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const data = await PaymentMethodService.getActive();
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred.";
    return { error: message };
  }
}
