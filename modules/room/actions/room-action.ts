"use server";

import { revalidatePath } from "next/cache";
import { roomSchema, type RoomInput } from "../schemas/room-schema";
import { RoomService } from "../services/room-service";
import { AuthGuardService } from "@/modules/auth/services/auth-guard-service";

export async function createRoomAction(values: RoomInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = roomSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await RoomService.create(validatedFields.data);
    revalidatePath("/rooms");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to create room:", error);
    return { error: "Terjadi kesalahan tak terduga." };
  }
}

export async function updateRoomAction(id: string, values: RoomInput) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    const validatedFields = roomSchema.safeParse(values);
    if (!validatedFields.success) {
      return { error: "Data form tidak valid." };
    }

    const result = await RoomService.update(id, validatedFields.data);
    revalidatePath("/rooms");

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Failed to update room:", error);
    return { error: "Terjadi kesalahan tak terduga." };
  }
}

export async function deleteRoomAction(id: string) {
  try {
    const authCheck = await AuthGuardService.requireAuth(["ADMIN"]);
    if (!authCheck.success) {
      return { error: authCheck.error };
    }

    await RoomService.delete(id);
    revalidatePath("/rooms");
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete room:", error);
    return { error: "Gagal menghapus ruangan." };
  }
}
