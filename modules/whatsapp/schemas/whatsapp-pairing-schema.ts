import { z } from "zod";

export const connectWhatsappSchema = z.object({
  instanceName: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      let clean = val.replace(/\D/g, "");
      if (clean.startsWith("0")) {
        clean = "62" + clean.substring(1);
      } else if (clean.startsWith("8")) {
        clean = "62" + clean;
      }
      return clean;
    }),
});

export const sendTestWhatsappSchema = z.object({
  instanceName: z.string().optional(),
  phoneNumber: z
    .string()
    .min(8, "Nomor WhatsApp minimal 8 digit")
    .max(20, "Nomor WhatsApp maksimal 20 digit")
    .regex(/^[0-9+\s()-]+$/, "Format nomor tidak valid")
    .transform((val) => {
      let clean = val.replace(/\D/g, "");
      if (clean.startsWith("0")) {
        clean = "62" + clean.substring(1);
      } else if (clean.startsWith("8")) {
        clean = "62" + clean;
      }
      return clean;
    }),
  message: z.string().min(1, "Pesan uji coba tidak boleh kosong"),
});

export const createWhatsappInstanceSchema = z.object({
  instanceName: z
    .string()
    .min(3, "Nama instance minimal 3 karakter")
    .max(50, "Nama instance maksimal 50 karakter")
    .regex(/^[a-zA-Z0-9_-]+$/, "Nama instance hanya boleh berisi huruf, angka, strip (-), dan garis bawah (_)"),
  branchId: z.string().optional(),
});

export const deleteWhatsappInstanceSchema = z.object({
  instanceName: z.string().min(1, "Nama instance wajib diisi"),
});

export const linkBranchWhatsappSchema = z.object({
  branchId: z.string().min(1, "ID Cabang wajib diisi"),
  instanceName: z.string().nullable().optional(),
});

export type ConnectWhatsappInput = z.infer<typeof connectWhatsappSchema>;
export type SendTestWhatsappInput = z.infer<typeof sendTestWhatsappSchema>;
export type CreateWhatsappInstanceInput = z.infer<typeof createWhatsappInstanceSchema>;
export type DeleteWhatsappInstanceInput = z.infer<typeof deleteWhatsappInstanceSchema>;
export type LinkBranchWhatsappInput = z.infer<typeof linkBranchWhatsappSchema>;

