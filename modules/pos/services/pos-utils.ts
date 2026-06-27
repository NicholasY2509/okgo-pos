import crypto from "crypto";

export class PosUtils {
  static generateTransactionNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TRX-${date}-${hex}`;
  }

  static generateVoucherCode(suffix?: string | null): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return suffix ? `VCH-${date}-${hex}-${suffix}` : `VCH-${date}-${hex}`;
  }
}
