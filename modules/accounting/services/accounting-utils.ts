import crypto from "crypto";

export class AccountingUtils {
  static generateJournalNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `JRN-${date}-${hex}`;
  }
}
