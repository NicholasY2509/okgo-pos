import { describe, it, expect, vi } from "vitest";
import { sendInvoiceWhatsappAction } from "./invoice-whatsapp-action";
import { InvoiceWhatsappService } from "../services/invoice-whatsapp-service";

vi.mock("../services/invoice-whatsapp-service", () => ({
  InvoiceWhatsappService: {
    sendInvoicePdf: vi.fn(),
  },
}));

describe("sendInvoiceWhatsappAction", () => {
  it("returns error on invalid input", async () => {
    const result = await sendInvoiceWhatsappAction({
      transactionId: "",
      phoneNumber: "123",
    });

    expect(result.error).toBeDefined();
  });

  it("calls InvoiceWhatsappService with normalized phone and returns success", async () => {
    vi.mocked(InvoiceWhatsappService.sendInvoicePdf).mockResolvedValueOnce({
      success: true,
      transactionNumber: "INV-001",
      recipient: "6281234567890",
      instanceName: "tester",
      evolutionResponse: { id: "msg-123" },
    });

    const result = await sendInvoiceWhatsappAction({
      transactionId: "tx-valid-id",
      phoneNumber: "081234567890",
    });

    expect(result.success).toBe(true);
    expect(InvoiceWhatsappService.sendInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: "tx-valid-id",
        phoneNumber: "6281234567890",
      })
    );
  });
});

