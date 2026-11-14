import { describe, it, expect } from "vitest";
import { InvoicePdfService } from "./invoice-pdf-service";

describe("InvoicePdfService", () => {
  const mockInvoiceData = {
    transaction: {
      id: "tx-test-01",
      transactionNumber: "INV-20261108-0001",
      createdAt: new Date("2026-11-08T10:00:00Z"),
      subtotal: 250000,
      discountTotal: 25000,
      taxTotal: 0,
      totalAmount: 225000,
      paidAmount: 250000,
      changeAmount: 25000,
      status: "COMPLETED",
      customer: {
        name: "Budi Santoso",
        phone: "081234567890",
      },
      cashierId: "staff-01",
      items: [
        {
          id: "item-1",
          itemNameSnapshot: "Deep Tissue Massage 60 Min",
          quantity: 1,
          unitPrice: 200000,
          discountAmount: 25000,
          subtotal: 175000,
        },
        {
          id: "item-2",
          itemNameSnapshot: "Aromatherapy Oil",
          quantity: 1,
          unitPrice: 50000,
          discountAmount: 0,
          subtotal: 50000,
        },
      ],
      payments: [
        {
          id: "pay-1",
          amount: 250000,
          paymentMethod: { name: "QRIS", type: "QRIS" },
          referenceNumber: "QRIS-88291",
        },
      ],
      voucherRedemptions: [],
    },
    branch: {
      id: "branch-01",
      name: "Downtown",
      address: "Jl. Sudirman No. 12, Jakarta",
      phone: "021-5551234",
    },
    cashierName: "Rina Salsabila",
    generatedVouchers: [],
  };

  it("generates a valid PDF byte buffer starting with PDF header", async () => {
    const bytes = await InvoicePdfService.generateInvoiceBytes(mockInvoiceData);
    expect(bytes).toBeDefined();
    expect(bytes.length).toBeGreaterThan(100);

    // Verify PDF header magic bytes %PDF-
    const header = Buffer.from(bytes.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });

  it("generates a non-empty base64 string", async () => {
    const base64 = await InvoicePdfService.generateInvoiceBase64(mockInvoiceData);
    expect(typeof base64).toBe("string");
    expect(base64.length).toBeGreaterThan(100);

    // Decoding back should start with %PDF-
    const decoded = Buffer.from(base64, "base64");
    expect(decoded.slice(0, 5).toString("utf-8")).toBe("%PDF-");
  });
});

