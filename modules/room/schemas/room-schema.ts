import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  capacity: z.coerce.number().min(1, "Kapasitas harus lebih dari 0").optional().or(z.literal("").transform(() => undefined)),
  isActive: z.boolean().default(true),
  branchId: z.string().min(1, "Cabang wajib dipilih"),
});

export type RoomInput = z.infer<typeof roomSchema>;
