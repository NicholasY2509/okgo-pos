import { describe, it, expect, vi } from "vitest";
import {
  getWhatsappStatusAction,
  connectWhatsappAction,
  logoutWhatsappAction,
} from "./whatsapp-pairing-action";
import { WhatsappPairingService } from "../services/whatsapp-pairing-service";

vi.mock("../services/whatsapp-pairing-service", () => ({
  WhatsappPairingService: {
    getConnectionStatus: vi.fn(),
    connect: vi.fn(),
    logout: vi.fn(),
    restart: vi.fn(),
    sendTestMessage: vi.fn(),
  },
}));

describe("whatsapp-pairing-action", () => {
  it("returns status on success", async () => {
    vi.mocked(WhatsappPairingService.getConnectionStatus).mockResolvedValueOnce({
      instanceName: "tester",
      state: "open",
      connected: true,
      serverUrl: "http://localhost:8080",
    });

    const res = await getWhatsappStatusAction();
    expect(res.success).toBe(true);
    expect(res.data?.connected).toBe(true);
  });

  it("handles connect request with optional phone", async () => {
    vi.mocked(WhatsappPairingService.connect).mockResolvedValueOnce({
      instanceName: "tester",
      state: "connecting",
      pairingCode: "ABCD-1234",
    });

    const res = await connectWhatsappAction({ phoneNumber: "08123456789" });
    expect(res.success).toBe(true);
    expect(WhatsappPairingService.connect).toHaveBeenCalledWith(undefined, "628123456789");
  });

  it("handles connect request with specified instanceName", async () => {
    vi.mocked(WhatsappPairingService.connect).mockResolvedValueOnce({
      instanceName: "nyenyak-juanda",
      state: "connecting",
      pairingCode: "WXYZ-5678",
    });

    const res = await connectWhatsappAction({ instanceName: "nyenyak-juanda", phoneNumber: "08123456789" });
    expect(res.success).toBe(true);
    expect(WhatsappPairingService.connect).toHaveBeenCalledWith("nyenyak-juanda", "628123456789");
  });

  it("handles logout request", async () => {
    vi.mocked(WhatsappPairingService.logout).mockResolvedValueOnce({
      success: true,
      message: "Disconnected",
    });

    const res = await logoutWhatsappAction();
    expect(res.success).toBe(true);
    expect(WhatsappPairingService.logout).toHaveBeenCalled();
  });
});

