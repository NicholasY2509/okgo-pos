import { describe, it, expect } from "vitest";
import { sendInvoiceWhatsappSchema } from "./invoice-whatsapp-schema";

describe("sendInvoiceWhatsappSchema", () => {
  it("normalizes local Indonesian phone numbers starting with 08 to 628", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "tx-123",
      phoneNumber: "081234567890",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBe("6281234567890");
    }
  });

  it("normalizes phone numbers starting with 8 to 628", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "tx-123",
      phoneNumber: "81234567890",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBe("6281234567890");
    }
  });

  it("cleans phone numbers with dashes, spaces, and plus signs", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "tx-123",
      phoneNumber: "+62 812-3456-7890",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBe("6281234567890");
    }
  });

  it("rejects phone numbers that are too short", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "tx-123",
      phoneNumber: "1234",
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing transactionId", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "",
      phoneNumber: "081234567890",
    });

    expect(result.success).toBe(false);
  });

  it("allows omitted or undefined phoneNumber for automated database lookup", () => {
    const result = sendInvoiceWhatsappSchema.safeParse({
      transactionId: "tx-123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phoneNumber).toBeUndefined();
    }
  });
});

