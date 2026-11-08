import { z } from "zod";

export function normalizePhoneNumber(raw: string): string {
  let clean = raw.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

export const sendInvoiceWhatsappSchema = z
  .object({
    transactionId: z.string().min(1, "ID transaksi wajib diisi"),
    phoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || (val.replace(/\D/g, "").length >= 8 && val.replace(/\D/g, "").length <= 20),
        { message: "Nomor WhatsApp harus antara 8 hingga 20 digit" }
      )
      .refine(
        (val) => !val || /^[0-9+\s()-]+$/.test(val),
        { message: "Format nomor telepon tidak valid" }
      ),
    caption: z.string().optional(),
  })
  .transform((val) => ({
    ...val,
    phoneNumber: val.phoneNumber && val.phoneNumber.trim().length > 0 ? normalizePhoneNumber(val.phoneNumber) : undefined,
  }));

export type SendInvoiceWhatsappInput = z.infer<typeof sendInvoiceWhatsappSchema>;


