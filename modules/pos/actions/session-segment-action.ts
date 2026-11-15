"use server";

import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";
import {
  addContinuationSegmentSchema,
  startSegmentSchema,
  switchActiveSegmentSchema,
  updateScheduledSegmentSchema,
  type AddContinuationSegmentInput,
  type StartSegmentInput,
  type SwitchActiveSegmentInput,
  type UpdateScheduledSegmentInput,
} from "../schemas/session-segment-schema";
import { SessionSegmentService } from "../services/session-segment-service";

export async function addContinuationSegmentAction(
  values: AddContinuationSegmentInput
) {
  try {
    await AuthGuardService.requireAuth();
    const validated = addContinuationSegmentSchema.safeParse(values);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Data segmen tidak valid." };
    }

    const segment = await SessionSegmentService.addContinuationSegment(validated.data);
    return { success: true, data: segment };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal menambahkan layanan lanjutan.";
    return { error: message };
  }
}

export async function switchActiveSegmentAction(
  values: SwitchActiveSegmentInput
) {
  try {
    await AuthGuardService.requireAuth();
    const validated = switchActiveSegmentSchema.safeParse(values);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Data pergantian tidak valid." };
    }

    const segment = await SessionSegmentService.switchActiveSegment(validated.data);
    return { success: true, data: segment };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mengganti layanan sesi.";
    return { error: message };
  }
}

export async function startSegmentAction(values: StartSegmentInput) {
  try {
    await AuthGuardService.requireAuth();
    const validated = startSegmentSchema.safeParse(values);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Data segmen tidak valid." };
    }

    const segment = await SessionSegmentService.startSegment(validated.data);
    return { success: true, data: segment };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memulai segmen layanan.";
    return { error: message };
  }
}

export async function updateScheduledSegmentAction(
  values: UpdateScheduledSegmentInput
) {
  try {
    await AuthGuardService.requireAuth();
    const validated = updateScheduledSegmentSchema.safeParse(values);
    if (!validated.success) {
      return { error: validated.error.issues[0]?.message || "Data segmen tidak valid." };
    }

    const segment = await SessionSegmentService.updateScheduledSegment(validated.data);
    return { success: true, data: segment };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal memperbarui segmen layanan.";
    return { error: message };
  }
}
