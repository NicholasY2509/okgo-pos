"use server";

import {
  connectWhatsappSchema,
  sendTestWhatsappSchema,
  createWhatsappInstanceSchema,
  deleteWhatsappInstanceSchema,
  linkBranchWhatsappSchema,
  type ConnectWhatsappInput,
  type SendTestWhatsappInput,
  type CreateWhatsappInstanceInput,
  type DeleteWhatsappInstanceInput,
  type LinkBranchWhatsappInput,
} from "../schemas/whatsapp-pairing-schema";
import { WhatsappPairingService } from "../services/whatsapp-pairing-service";

export async function getWhatsappStatusAction(instanceName?: string) {
  try {
    const status = await WhatsappPairingService.getConnectionStatus(instanceName);
    return { success: true, data: status };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memeriksa status WhatsApp.";
    return { error: message };
  }
}

export async function connectWhatsappAction(params?: ConnectWhatsappInput) {
  try {
    const validated = connectWhatsappSchema.safeParse(params || {});
    const phone = validated.success ? validated.data.phoneNumber : undefined;
    const instance = validated.success ? validated.data.instanceName : undefined;

    const result = await WhatsappPairingService.connect(instance, phone);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghubungkan WhatsApp.";
    return { error: message };
  }
}

export async function logoutWhatsappAction(instanceName?: string) {
  try {
    const result = await WhatsappPairingService.logout(instanceName);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memutuskan WhatsApp.";
    return { error: message };
  }
}

export async function restartWhatsappAction(instanceName?: string) {
  try {
    const result = await WhatsappPairingService.restart(instanceName);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal me-restart WhatsApp instance.";
    return { error: message };
  }
}

export async function sendWhatsappTestMessageAction(params: SendTestWhatsappInput) {
  try {
    const validated = sendTestWhatsappSchema.safeParse(params);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Data nomor atau pesan tidak valid.";
      return { error: issue };
    }

    const result = await WhatsappPairingService.sendTestMessage(
      validated.data.phoneNumber,
      validated.data.message,
      validated.data.instanceName
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengirim pesan uji coba.";
    return { error: message };
  }
}

export async function createWhatsappInstanceAction(params: CreateWhatsappInstanceInput) {
  try {
    const validated = createWhatsappInstanceSchema.safeParse(params);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Nama instance tidak valid.";
      return { error: issue };
    }

    const result = await WhatsappPairingService.createInstance(
      validated.data.instanceName,
      validated.data.branchId
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat WhatsApp instance.";
    return { error: message };
  }
}

export async function deleteWhatsappInstanceAction(params: DeleteWhatsappInstanceInput) {
  try {
    const validated = deleteWhatsappInstanceSchema.safeParse(params);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Nama instance tidak valid.";
      return { error: issue };
    }

    const result = await WhatsappPairingService.deleteInstance(validated.data.instanceName);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus WhatsApp instance.";
    return { error: message };
  }
}

export async function linkBranchWhatsappAction(params: LinkBranchWhatsappInput) {
  try {
    const validated = linkBranchWhatsappSchema.safeParse(params);
    if (!validated.success) {
      const issue = validated.error.issues[0]?.message || "Data cabang tidak valid.";
      return { error: issue };
    }

    const result = await WhatsappPairingService.linkBranchInstance(
      validated.data.branchId,
      validated.data.instanceName || null
    );
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui konfigurasi WhatsApp cabang.";
    return { error: message };
  }
}

export async function listAllWhatsappInstancesAction() {
  try {
    const result = await WhatsappPairingService.listAllInstancesWithBranches();
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil daftar instance.";
    return { error: message };
  }
}

export async function getBranchWhatsappConfigAction(branchId: string) {
  try {
    const result = await WhatsappPairingService.getBranchWhatsappInfo(branchId);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memuat konfigurasi WhatsApp cabang.";
    return { error: message };
  }
}

