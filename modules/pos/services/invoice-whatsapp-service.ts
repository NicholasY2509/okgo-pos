import { InvoiceRepository } from "../repositories/invoice-repository";
import { InvoicePdfService } from "./invoice-pdf-service";
import { EvolutionApiService } from "./evolution-api-service";
import { normalizePhoneNumber } from "../schemas/invoice-whatsapp-schema";

interface SendInvoiceParams {
  transactionId: string;
  phoneNumber?: string;
  caption?: string;
}

export class InvoiceWhatsappService {
  /**
   * Generates invoice PDF and sends it to the customer's WhatsApp via Evolution API
   */
  static async sendInvoicePdf({ transactionId, phoneNumber, caption }: SendInvoiceParams) {
    // 1. Fetch complete invoice and transaction data
    const invoiceData = await InvoiceRepository.getInvoiceData(transactionId);
    if (!invoiceData || !invoiceData.transaction) {
      throw new Error("Data transaksi tidak ditemukan.");
    }

    const { transaction, branch, cashierName, generatedVouchers } = invoiceData;

    // Determine target phone number
    const rawPhone = phoneNumber || transaction.customer?.phone;
    if (!rawPhone || rawPhone.trim() === "") {
      throw new Error("Pelanggan tidak memiliki nomor WhatsApp terdaftar.");
    }

    const targetPhone = normalizePhoneNumber(rawPhone);
    if (targetPhone.length < 8) {
      throw new Error("Nomor WhatsApp pelanggan tidak valid.");
    }

    // 2. Generate PDF Base64
    const pdfBase64 = await InvoicePdfService.generateInvoiceBase64({
      transaction,
      branch,
      cashierName,
      generatedVouchers,
    });

    // 3. Compose caption if not provided
    const customerName = transaction.customer?.name || "Pelanggan Nyenyak";
    const branchName = branch?.name ? `Cabang ${branch.name}` : "";
    const txNum = transaction.transactionNumber;

    const defaultCaption =
      caption?.trim() ||
      `Halo Kak ${customerName}, terima kasih telah berkunjung ke Nyenyak.\n\nBerikut kami lampirkan struk pembayaran digital resmi untuk transaksi anda.\n\nSemoga hari Anda menyenangkan dan kami tunggu kedatangan Anda kembali!`;

    const fileName = `Struk-${txNum.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    // Determine target WhatsApp instance (branch-specific or global fallback)
    const branchInstance = branch?.whatsappInstanceName?.trim();
    const targetInstance = branchInstance || process.env.EVOLUTION_INSTANCE_NAME?.trim() || "tester";

    // 4. Send via Evolution API
    const response = await EvolutionApiService.sendMedia({
      number: targetPhone,
      mediaBase64: pdfBase64,
      fileName,
      caption: defaultCaption,
      mimetype: "application/pdf",
      instanceName: targetInstance,
    });

    return {
      success: true,
      transactionNumber: txNum,
      recipient: targetPhone,
      instanceName: targetInstance,
      evolutionResponse: response,
    };
  }

  /**
   * Previews or downloads the invoice PDF as Base64/data URI
   */
  static async getInvoicePdfBase64(transactionId: string): Promise<{ base64: string; fileName: string }> {
    const invoiceData = await InvoiceRepository.getInvoiceData(transactionId);
    if (!invoiceData || !invoiceData.transaction) {
      throw new Error("Data transaksi tidak ditemukan.");
    }

    const pdfBase64 = await InvoicePdfService.generateInvoiceBase64(invoiceData);
    const txNum = invoiceData.transaction.transactionNumber;
    const fileName = `Struk-${txNum.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

    return {
      base64: pdfBase64,
      fileName,
    };
  }
}

