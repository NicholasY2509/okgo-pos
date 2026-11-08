"use server";

import {
  sendInvoiceWhatsappSchema,
  type SendInvoiceWhatsappInput,
} from "../schemas/invoice-whatsapp-schema";
import { InvoiceWhatsappService } from "../services/invoice-whatsapp-service";
import { EvolutionApiService } from "../services/evolution-api-service";

export async function sendInvoiceWhatsappAction(values: SendInvoiceWhatsappInput) {
  try {
    const validatedFields = sendInvoiceWhatsappSchema.safeParse(values);
    if (!validatedFields.success) {
      const issue = validatedFields.error.issues[0]?.message || "Data pengiriman tidak valid.";
      return { error: issue };
    }

    const result = await InvoiceWhatsappService.sendInvoicePdf(validatedFields.data);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("sendInvoiceWhatsappAction error:", error);
    const message = error instanceof Error ? error.message : "Gagal mengirim WhatsApp invoice.";
    return { error: message };
  }
}

export async function checkEvolutionApiStatusAction() {
  try {
    return await EvolutionApiService.checkStatus();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Tidak dapat mengecek status WhatsApp.";
    return { connected: false, state: "ERROR", error: message };
  }
}

export async function getInvoicePdfBase64Action(transactionId: string) {
  try {
    if (!transactionId) {
      return { error: "ID transaksi tidak valid." };
    }
    const result = await InvoiceWhatsappService.getInvoicePdfBase64(transactionId);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengunduh invoice PDF.";
    return { error: message };
  }
}

