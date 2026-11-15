import { z } from "zod";

export const addContinuationSegmentSchema = z.object({
  sessionId: z.string().min(1, "ID sesi wajib diisi"),
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  staffId: z.string().min(1, "Terapis wajib dipilih"),
  roomId: z.string().min(1).optional(),
  durationMinutes: z.number().int().min(1).optional(),
});

export const switchActiveSegmentSchema = z.object({
  sessionId: z.string().min(1, "ID sesi wajib diisi"),
  serviceId: z.string().min(1, "Layanan pengganti wajib dipilih"),
  staffId: z.string().min(1, "Terapis wajib dipilih"),
  roomId: z.string().min(1).optional(),
});

export const startSegmentSchema = z.object({
  sessionId: z.string().min(1, "ID sesi wajib diisi"),
  segmentId: z.string().min(1, "ID segmen wajib diisi"),
});

export const updateScheduledSegmentSchema = z.object({
  sessionId: z.string().min(1, "ID sesi wajib diisi"),
  segmentId: z.string().min(1, "ID segmen wajib diisi"),
  serviceId: z.string().min(1, "Layanan wajib dipilih"),
  staffId: z.string().min(1, "Terapis wajib dipilih"),
  roomId: z.string().min(1, "Ruangan wajib dipilih"),
});

export type AddContinuationSegmentInput = z.infer<typeof addContinuationSegmentSchema>;
export type SwitchActiveSegmentInput = z.infer<typeof switchActiveSegmentSchema>;
export type StartSegmentInput = z.infer<typeof startSegmentSchema>;
export type UpdateScheduledSegmentInput = z.infer<typeof updateScheduledSegmentSchema>;
