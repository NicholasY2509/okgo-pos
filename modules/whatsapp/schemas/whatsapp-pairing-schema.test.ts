import { describe, it, expect } from "vitest";
import {
  connectWhatsappSchema,
  sendTestWhatsappSchema,
  createWhatsappInstanceSchema,
  deleteWhatsappInstanceSchema,
  linkBranchWhatsappSchema,
} from "./whatsapp-pairing-schema";

describe("whatsapp-pairing-schema", () => {
  describe("connectWhatsappSchema", () => {
    it("handles undefined or empty phone number gracefully for QR code mode", () => {
      const res = connectWhatsappSchema.safeParse({});
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phoneNumber).toBeUndefined();
      }
    });

    it("normalizes phone numbers starting with 08 to 628 for pairing code mode", () => {
      const res = connectWhatsappSchema.safeParse({ phoneNumber: "08123456789" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phoneNumber).toBe("628123456789");
      }
    });
  });

  describe("sendTestWhatsappSchema", () => {
    it("validates and normalizes valid test phone and message", () => {
      const res = sendTestWhatsappSchema.safeParse({
        phoneNumber: "089876543210",
        message: "Test message from Nyenyak POS",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.phoneNumber).toBe("6289876543210");
        expect(res.data.message).toBe("Test message from Nyenyak POS");
      }
    });

    it("rejects empty message", () => {
      const res = sendTestWhatsappSchema.safeParse({
        phoneNumber: "089876543210",
        message: "",
      });
      expect(res.success).toBe(false);
    });

    it("rejects phone numbers with too few digits", () => {
      const res = sendTestWhatsappSchema.safeParse({
        phoneNumber: "123",
        message: "Hello",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("createWhatsappInstanceSchema", () => {
    it("accepts valid alphanumeric instance names with dashes", () => {
      const res = createWhatsappInstanceSchema.safeParse({
        instanceName: "nyenyak-juanda-01",
        branchId: "branch-123",
      });
      expect(res.success).toBe(true);
    });

    it("rejects instance names that are too short", () => {
      const res = createWhatsappInstanceSchema.safeParse({
        instanceName: "ab",
      });
      expect(res.success).toBe(false);
    });

    it("rejects invalid characters in instance names", () => {
      const res = createWhatsappInstanceSchema.safeParse({
        instanceName: "nyenyak juanda!@#",
      });
      expect(res.success).toBe(false);
    });
  });

  describe("linkBranchWhatsappSchema", () => {
    it("accepts valid branch linking input", () => {
      const res = linkBranchWhatsappSchema.safeParse({
        branchId: "branch-01",
        instanceName: "nyenyak-juanda",
      });
      expect(res.success).toBe(true);
    });

    it("accepts null instanceName to unlink", () => {
      const res = linkBranchWhatsappSchema.safeParse({
        branchId: "branch-01",
        instanceName: null,
      });
      expect(res.success).toBe(true);
    });
  });
});

