import { z } from "zod";

export const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nama wajib diisi"),
  capacity: z.coerce.number().min(1, "Kapasitas harus lebih dari 0").optional().or(z.literal("").transform(() => undefined)),
  isVip: z.boolean().default(false),
  isActive: z.boolean().default(true),
  branchId: z.string().min(1, "Cabang wajib dipilih"),
});

export type RoomInput = z.infer<typeof roomSchema>;

export const portalRoomsQuerySchema = z.object({
  branchId: z.string().min(1, "ID cabang wajib diisi."),
});

export type PortalRoomsQueryInput = z.infer<typeof portalRoomsQuerySchema>;

export const portalRoomSessionsQuerySchema = z.object({
  branchId: z.string().min(1, "ID cabang wajib diisi."),
  roomId: z.string().min(1, "ID ruangan wajib diisi."),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .optional(),
});

export type PortalRoomSessionsQueryInput = z.infer<
  typeof portalRoomSessionsQuerySchema
>;

export const portalSessionActionSchema = z.object({
  branchId: z.string().min(1, "ID cabang wajib diisi."),
  action: z.enum(["START", "COMPLETE"], {
    message: "Aksi harus START atau COMPLETE.",
  }),
  staffId: z.string().min(1, "ID terapis wajib diisi."),
});

export type PortalSessionActionInput = z.infer<
  typeof portalSessionActionSchema
>;
