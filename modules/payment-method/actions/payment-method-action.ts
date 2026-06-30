"use server";

import { revalidatePath } from "next/cache";
import { paymentMethodSchema, type PaymentMethodInput } from "../schemas/payment-method-schema";
import { PaymentMethodService } from "../services/payment-method-service";

export async function createPaymentMethodAction(values: PaymentMethodInput) {
  try {
    const validatedFields = paymentMethodSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PaymentMethodService.create(validatedFields.data);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updatePaymentMethodAction(id: string, values: PaymentMethodInput) {
  try {
    const validatedFields = paymentMethodSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    await PaymentMethodService.update(id, validatedFields.data);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deletePaymentMethodAction(id: string) {
  try {
    await PaymentMethodService.delete(id);
    revalidatePath("/admin/payment-methods");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function getActivePaymentMethodsAction() {
  try {
    const data = await PaymentMethodService.getActive();
    return { success: true, data };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
