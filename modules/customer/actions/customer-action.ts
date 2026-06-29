"use server";

import { revalidatePath } from "next/cache";
import { customerSchema, type CustomerInput } from "../schemas/customer-schema";
import { CustomerService } from "../services/customer-service";

export async function searchCustomersAction(query: string = "", page: number = 1, limit: number = 20) {
  try {
    const result = await CustomerService.searchCustomers(query, page, limit);
    return { success: true, data: result.data, metadata: result.metadata };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function getCustomerByIdAction(id: string) {
  try {
    const customer = await CustomerService.getById(id);
    return { success: true, data: customer };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function createCustomerAction(values: CustomerInput) {
  try {
    const validatedFields = customerSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const customer = await CustomerService.create(validatedFields.data);
    revalidatePath("/admin/customers");
    return { success: true, data: customer };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function updateCustomerAction(id: string, values: CustomerInput) {
  try {
    const validatedFields = customerSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Invalid form data." };
    }

    const customer = await CustomerService.update(id, validatedFields.data);
    revalidatePath("/admin/customers");
    return { success: true, data: customer };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await CustomerService.delete(id);
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "An unexpected error occurred." };
  }
}
