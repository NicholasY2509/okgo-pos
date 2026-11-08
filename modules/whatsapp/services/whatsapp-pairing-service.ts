import { prisma } from "@/lib/prisma";
import { EvolutionApiService } from "@/modules/pos/services/evolution-api-service";

export interface WhatsappConnectionInfo {
  instanceName: string;
  state: "open" | "close" | "connecting" | "refused" | "unreachable" | "unknown";
  connected: boolean;
  owner?: string | null;
  profileName?: string | null;
  profilePictureUrl?: string | null;
  serverUrl: string;
  error?: string;
}

export interface ConnectResult {
  instanceName: string;
  state?: string;
  connected?: boolean;
  base64?: string | null;
  pairingCode?: string | null;
  code?: string | null;
  count?: number;
  message?: string;
}

export interface BranchInstanceInfo {
  branchId?: string;
  branchName?: string;
  subdomain?: string;
  instanceName: string;
  state: "open" | "close" | "connecting" | "refused" | "unreachable" | "unknown";
  connected: boolean;
  owner?: string | null;
  profileName?: string | null;
  profilePictureUrl?: string | null;
  isDefaultInstance?: boolean;
}

export interface MultiInstanceDashboardData {
  instances: BranchInstanceInfo[];
  branchesWithoutInstance: {
    id: string;
    name: string;
    subdomain: string;
    phone?: string | null;
  }[];
  defaultInstanceName: string;
  serverUrl: string;
}

export class WhatsappPairingService {
  private static getBaseUrl(): string {
    return (process.env.EVOLUTION_API_URL || "http://localhost:8080").trim().replace(/\/+$/, "");
  }

  private static getApiKey(): string {
    return (process.env.EVOLUTION_API_KEY || "").trim();
  }

  private static getInstanceName(): string {
    return (process.env.EVOLUTION_INSTANCE_NAME || "tester").trim();
  }

  /**
   * Filter only instances belonging or linked to the Nyenyak application
   */
  private static isNyenyakInstance(name: string, branchAssignedNames: Set<string>): boolean {
    if (!name) return false;
    const lower = name.trim().toLowerCase();
    const defaultLower = this.getInstanceName().toLowerCase();
    return (
      lower.includes("nyenyak") ||
      lower === defaultLower ||
      branchAssignedNames.has(lower)
    );
  }

  /**
   * Get live connection state and instance profile metadata for a specific instance
   */
  static async getConnectionStatus(targetInstanceName?: string): Promise<WhatsappConnectionInfo> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instanceName = (targetInstanceName || this.getInstanceName()).trim();

    try {
      // 1. Check live connection state
      const stateRes = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
        method: "GET",
        headers: { apikey: apiKey },
        cache: "no-store",
      });

      if (!stateRes.ok) {
        return {
          instanceName,
          state: "close",
          connected: false,
          serverUrl: baseUrl,
          error: `HTTP ${stateRes.status}: ${stateRes.statusText}`,
        };
      }

      const stateData = await stateRes.json();
      const rawState = (stateData?.instance?.state || stateData?.state || "unknown").toLowerCase();
      const isConnected = rawState === "open";

      let owner: string | null = null;
      let profileName: string | null = null;
      let profilePictureUrl: string | null = null;

      // 2. Retrieve owner phone number and profile info from fetchInstances
      try {
        const instances = await EvolutionApiService.fetchInstances();
        const found = instances.find(
          (i: any) => i.name?.trim().toLowerCase() === instanceName.toLowerCase()
        );
        if (found) {
          const cleanOwnerJid = found.ownerJid ? String(found.ownerJid).split("@")[0] : null;
          let rawNum = found.number || cleanOwnerJid || found.owner || null;
          if (rawNum && rawNum.startsWith("0")) {
            rawNum = "62" + rawNum.substring(1);
          }
          owner = rawNum;
          profileName = found.profileName || null;
          profilePictureUrl = found.profilePicUrl || found.profilePictureUrl || null;
        }
      } catch {
        // Non-critical metadata query error
      }

      return {
        instanceName,
        state: isConnected ? "open" : rawState === "connecting" ? "connecting" : "close",
        connected: isConnected,
        owner,
        profileName,
        profilePictureUrl,
        serverUrl: baseUrl,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tidak dapat terhubung ke server Evolution API";
      return {
        instanceName,
        state: "unreachable",
        connected: false,
        serverUrl: baseUrl,
        error: msg,
      };
    }
  }

  /**
   * Request QR code or pairing code to pair a WhatsApp account
   */
  static async connect(targetInstanceName?: string, phoneNumber?: string): Promise<ConnectResult> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instanceName = (targetInstanceName || this.getInstanceName()).trim();

    let url = `${baseUrl}/instance/connect/${encodeURIComponent(instanceName)}`;
    if (phoneNumber) {
      url += `?number=${encodeURIComponent(phoneNumber)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { apikey: apiKey },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        data?.response?.message ||
        data?.message ||
        data?.error ||
        `Gagal menghubungkan WhatsApp (HTTP ${response.status})`;
      throw new Error(Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg));
    }

    // If already connected
    if (data?.instance?.state === "open" || data?.state === "open") {
      return {
        instanceName,
        state: "open",
        connected: true,
      };
    }

    return {
      instanceName,
      state: data?.instance?.status || data?.state || "connecting",
      connected: false,
      base64: data?.base64 || data?.qrcode?.base64 || null,
      pairingCode: data?.pairingCode || data?.qrcode?.pairingCode || null,
      code: data?.code || data?.qrcode?.code || null,
      count: data?.count || data?.qrcode?.count,
    };
  }

  /**
   * Logout / unpair the connected WhatsApp session
   */
  static async logout(targetInstanceName?: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instanceName = (targetInstanceName || this.getInstanceName()).trim();

    const response = await fetch(`${baseUrl}/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: "DELETE",
      headers: { apikey: apiKey },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        data?.response?.message ||
        data?.message ||
        data?.error ||
        `Gagal memutuskan sambungan WhatsApp (HTTP ${response.status})`;
      throw new Error(Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg));
    }

    return {
      success: true,
      message: `Sambungan WhatsApp ${instanceName} berhasil diputuskan.`,
    };
  }

  /**
   * Restart instance in Evolution API
   */
  static async restart(targetInstanceName?: string): Promise<{ success: boolean; message: string }> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instanceName = (targetInstanceName || this.getInstanceName()).trim();

    const response = await fetch(`${baseUrl}/instance/restart/${encodeURIComponent(instanceName)}`, {
      method: "POST",
      headers: { apikey: apiKey },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        data?.response?.message ||
        data?.message ||
        data?.error ||
        `Gagal me-restart instance WhatsApp (HTTP ${response.status})`;
      throw new Error(Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg));
    }

    return {
      success: true,
      message: `Instance WhatsApp ${instanceName} berhasil di-restart.`,
    };
  }

  /**
   * Send test message
   */
  static async sendTestMessage(phoneNumber: string, message: string, targetInstanceName?: string) {
    const instanceName = (targetInstanceName || this.getInstanceName()).trim();
    return await EvolutionApiService.sendText({
      number: phoneNumber,
      text: message,
      instanceName,
    });
  }

  /**
   * Create a new instance and optionally link it to a branch
   */
  static async createInstance(instanceName: string, branchId?: string) {
    const cleanName = instanceName.trim();
    const result = await EvolutionApiService.createInstance(cleanName);

    if (branchId) {
      await prisma.branch.update({
        where: { id: branchId },
        data: { whatsappInstanceName: cleanName },
      });
    }

    return result;
  }

  /**
   * Delete an instance from Evolution API and unlink from any branches
   */
  static async deleteInstance(instanceName: string) {
    const cleanName = instanceName.trim();

    // 1. Unlink branches pointing to this instance
    await prisma.branch.updateMany({
      where: { whatsappInstanceName: cleanName },
      data: { whatsappInstanceName: null },
    });

    // 2. Delete instance in Evolution API
    return await EvolutionApiService.deleteInstance(cleanName);
  }

  /**
   * Link or unlink an instance to a branch in database
   */
  static async linkBranchInstance(branchId: string, instanceName: string | null) {
    const cleanName = instanceName && instanceName.trim() !== "" ? instanceName.trim() : null;
    return await prisma.branch.update({
      where: { id: branchId },
      data: { whatsappInstanceName: cleanName },
    });
  }

  /**
   * List all Evolution API instances along with branch association and connection status
   */
  static async listAllInstancesWithBranches(): Promise<MultiInstanceDashboardData> {
    const baseUrl = this.getBaseUrl();
    const defaultInstanceName = this.getInstanceName();

    // 1. Fetch all branches
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        subdomain: true,
        phone: true,
        whatsappInstanceName: true,
      },
      orderBy: { name: "asc" },
    });

    // 2. Fetch instances from Evolution API
    let rawInstances: any[] = [];
    try {
      rawInstances = await EvolutionApiService.fetchInstances();
    } catch {
      // Return empty instances array if Evolution API unreachable
    }

    const branchAssignedNames = new Set(
      branches
        .map((b) => b.whatsappInstanceName?.toLowerCase().trim())
        .filter(Boolean) as string[]
    );

    // 3. Map instances (strictly filtering to Nyenyak-related instances)
    const instanceMap = new Map<string, any>();
    for (const inst of rawInstances) {
      if (inst?.name && this.isNyenyakInstance(inst.name, branchAssignedNames)) {
        instanceMap.set(inst.name.trim().toLowerCase(), inst);
      }
    }

    // Ensure default instance appears if not in list
    if (defaultInstanceName && !instanceMap.has(defaultInstanceName.toLowerCase())) {
      instanceMap.set(defaultInstanceName.toLowerCase(), {
        name: defaultInstanceName,
        connectionStatus: "close",
      });
    }

    const branchInstanceInfos: BranchInstanceInfo[] = [];

    // Match branches
    for (const branch of branches) {
      const instName = branch.whatsappInstanceName?.trim();
      if (instName) {
        const found = instanceMap.get(instName.toLowerCase());
        const rawState = (found?.connectionStatus || found?.state || "close").toLowerCase();
        const isConnected = rawState === "open";
        const cleanOwnerJid = found?.ownerJid ? String(found.ownerJid).split("@")[0] : null;

        branchInstanceInfos.push({
          branchId: branch.id,
          branchName: branch.name,
          subdomain: branch.subdomain,
          instanceName: instName,
          state: isConnected ? "open" : rawState === "connecting" ? "connecting" : "close",
          connected: isConnected,
          owner: found?.number || cleanOwnerJid || found?.owner || null,
          profileName: found?.profileName || null,
          profilePictureUrl: found?.profilePicUrl || found?.profilePictureUrl || null,
          isDefaultInstance: instName.toLowerCase() === defaultInstanceName.toLowerCase(),
        });

        // Mark as processed in map
        instanceMap.delete(instName.toLowerCase());
      }
    }

    // Any remaining instances not assigned to a branch
    for (const [key, inst] of instanceMap.entries()) {
      const name = inst.name || key;
      const rawState = (inst?.connectionStatus || inst?.state || "close").toLowerCase();
      const isConnected = rawState === "open";
      const cleanOwnerJid = inst?.ownerJid ? String(inst.ownerJid).split("@")[0] : null;

      branchInstanceInfos.push({
        instanceName: name,
        state: isConnected ? "open" : rawState === "connecting" ? "connecting" : "close",
        connected: isConnected,
        owner: inst?.number || cleanOwnerJid || inst?.owner || null,
        profileName: inst?.profileName || null,
        profilePictureUrl: inst?.profilePicUrl || inst?.profilePictureUrl || null,
        isDefaultInstance: name.toLowerCase() === defaultInstanceName.toLowerCase(),
      });
    }

    const branchesWithoutInstance = branches.filter((b) => !b.whatsappInstanceName);

    return {
      instances: branchInstanceInfos,
      branchesWithoutInstance,
      defaultInstanceName,
      serverUrl: baseUrl,
    };
  }

  /**
   * Get WhatsApp configuration and live status for a specific branch
   */
  static async getBranchWhatsappInfo(branchId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        phone: true,
        whatsappInstanceName: true,
      },
    });

    if (!branch) {
      throw new Error("Cabang tidak ditemukan.");
    }

    const instanceName = branch.whatsappInstanceName?.trim() || `nyenyak-${branch.subdomain}`;
    const status = await this.getConnectionStatus(instanceName);

    // List all existing instances so user can select an existing one if desired (strictly Nyenyak instances)
    let allInstances: string[] = [];
    try {
      const raw = await EvolutionApiService.fetchInstances();
      const allBranches = await prisma.branch.findMany({ select: { whatsappInstanceName: true } });
      const branchNames = new Set(
        allBranches.map((b) => b.whatsappInstanceName?.toLowerCase().trim()).filter(Boolean) as string[]
      );
      allInstances = raw
        .map((i: any) => i.name)
        .filter((name: string) => name && this.isNyenyakInstance(name, branchNames));
    } catch {
      // ignore
    }

    return {
      branch,
      configuredInstanceName: branch.whatsappInstanceName,
      activeInstanceName: instanceName,
      status,
      allInstances,
    };
  }
}

