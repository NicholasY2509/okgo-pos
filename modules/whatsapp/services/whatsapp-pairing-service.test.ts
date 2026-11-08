import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WhatsappPairingService } from "./whatsapp-pairing-service";

describe("WhatsappPairingService", () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.EVOLUTION_API_URL = "http://localhost:8080";
    process.env.EVOLUTION_INSTANCE_NAME = "tester";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("returns open connection state when Evolution API reports open", async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/instance/connectionState/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ instance: { state: "open" } }),
        });
      }
      if (url.includes("/instance/fetchInstances")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                name: "tester",
                owner: "6281234567890",
                profileName: "Nyenyak POS Official",
              },
            ]),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as any;

    const result = await WhatsappPairingService.getConnectionStatus();
    expect(result.connected).toBe(true);
    expect(result.state).toBe("open");
    expect(result.owner).toBe("6281234567890");
    expect(result.profileName).toBe("Nyenyak POS Official");
  });

  it("returns unreachable state when Evolution API fails to connect", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

    const result = await WhatsappPairingService.getConnectionStatus();
    expect(result.connected).toBe(false);
    expect(result.state).toBe("unreachable");
    expect(result.error).toContain("Connection refused");
  });

  it("calls DELETE /instance/logout on logout", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "SUCCESS" }),
    });

    const result = await WhatsappPairingService.logout();
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/instance/logout/tester"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

