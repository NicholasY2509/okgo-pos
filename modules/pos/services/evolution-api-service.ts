interface SendMediaParams {
  number: string;
  mediaBase64: string;
  fileName: string;
  caption?: string;
  mimetype?: string;
  instanceName?: string;
}

interface SendTextParams {
  number: string;
  text: string;
  instanceName?: string;
}

export class EvolutionApiService {
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
   * Check connection status of a WhatsApp instance in Evolution API
   */
  static async checkStatus(instanceName?: string): Promise<{ connected: boolean; state: string; error?: string }> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instance = (instanceName || this.getInstanceName()).trim();

    try {
      const response = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instance)}`, {
        method: "GET",
        headers: {
          apikey: apiKey,
        },
      });

      if (!response.ok) {
        return {
          connected: false,
          state: "DISCONNECTED",
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      const state = data?.instance?.state || data?.state || "UNKNOWN";
      return {
        connected: state === "open",
        state,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal terhubung ke Evolution API";
      return {
        connected: false,
        state: "UNREACHABLE",
        error: msg,
      };
    }
  }

  /**
   * Fetch all instances managed by Evolution API
   */
  static async fetchInstances(): Promise<any[]> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: "GET",
      headers: { apikey: apiKey },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Gagal mengambil daftar instance`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  /**
   * Programmatically create a new WhatsApp instance in Evolution API
   */
  static async createInstance(instanceName: string) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const cleanName = instanceName.trim();
    const response = await fetch(`${baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        instanceName: cleanName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = data?.response?.message || data?.message || `HTTP ${response.status}: Gagal membuat instance`;
      throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }

    return data;
  }

  /**
   * Programmatically delete an instance from Evolution API
   */
  static async deleteInstance(instanceName: string) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const cleanName = instanceName.trim();
    const response = await fetch(`${baseUrl}/instance/delete/${encodeURIComponent(cleanName)}`, {
      method: "DELETE",
      headers: {
        apikey: apiKey,
      },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg = data?.response?.message || data?.message || `HTTP ${response.status}: Gagal menghapus instance`;
      throw new Error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    }

    return data;
  }

  /**
   * Send PDF or other media document via Evolution API
   */
  static async sendMedia({
    number,
    mediaBase64,
    fileName,
    caption,
    mimetype = "application/pdf",
    instanceName,
  }: SendMediaParams) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instance = (instanceName || this.getInstanceName()).trim();

    if (!apiKey) {
      throw new Error("EVOLUTION_API_KEY belum dikonfigurasi di environment variables (.env).");
    }

    const payload = {
      number,
      mediatype: "document",
      mimetype,
      caption: caption || undefined,
      media: mediaBase64,
      fileName,
    };

    const response = await fetch(`${baseUrl}/message/sendMedia/${encodeURIComponent(instance)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        responseData?.response?.message ||
        responseData?.message ||
        responseData?.error ||
        `Gagal mengirim WhatsApp (HTTP ${response.status})`;
      throw new Error(Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg));
    }

    return responseData;
  }

  /**
   * Send a plain text WhatsApp message via Evolution API
   */
  static async sendText({ number, text, instanceName }: SendTextParams) {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    const instance = (instanceName || this.getInstanceName()).trim();

    const response = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        number,
        text,
      }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        responseData?.response?.message ||
        responseData?.message ||
        responseData?.error ||
        `Gagal mengirim teks WhatsApp (HTTP ${response.status})`;
      throw new Error(Array.isArray(errMsg) ? errMsg.join(", ") : String(errMsg));
    }

    return responseData;
  }
}

