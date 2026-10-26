import { describe, it, expect, vi, beforeEach } from "vitest";
import { PosTransactionRepository } from "./pos-transaction-repository";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/modules/accounting/services/journal-entry-automation", () => ({
  JournalEntryAutomation: {
    handleTransactionCancelled: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("PosTransactionRepository.cancelTransaction", () => {
  let mockTx: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTx = {
      transaction: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "tx-1", status: "CANCELLED" }),
      },
      serviceSession: {
        update: vi.fn(),
      },
      booking: {
        updateMany: vi.fn(),
      },
      customerVoucher: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      staffIncentive: {
        deleteMany: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      return await callback(mockTx);
    });
  });

  it("should throw error if transaction is older than 2 days", async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-old",
      status: "COMPLETED",
      createdAt: threeDaysAgo,
      items: [],
      voucherRedemptions: [],
    });

    await expect(PosTransactionRepository.cancelTransaction("tx-old")).rejects.toThrow(
      "Transaksi yang sudah melewati batas 2 hari tidak dapat dibatalkan."
    );
  });

  it("should throw error if transaction is already cancelled", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-cancelled",
      status: "CANCELLED",
      createdAt: new Date(),
      items: [],
      voucherRedemptions: [],
    });

    await expect(PosTransactionRepository.cancelTransaction("tx-cancelled")).rejects.toThrow(
      "Transaksi sudah dibatalkan."
    );
  });

  it("should reject cancellation if any voucher in a voucher packet purchase has been redeemed", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-vp",
      status: "COMPLETED",
      createdAt: new Date(),
      items: [],
      voucherRedemptions: [],
    });

    // 12 vouchers purchased: 1 used, 11 unused
    const mockVouchers = [
      { id: "v-1", status: "USED_UP", redemptions: [{ id: "r-1" }] },
      ...Array.from({ length: 11 }, (_, i) => ({
        id: `v-${i + 2}`,
        status: "ACTIVE",
        initialVisitCount: 1,
        remainingVisitCount: 1,
        redemptions: [],
      })),
    ];

    mockTx.customerVoucher.findMany.mockResolvedValue(mockVouchers);

    await expect(PosTransactionRepository.cancelTransaction("tx-vp")).rejects.toThrow(
      "Tidak dapat membatalkan transaksi karena 1 dari 12 voucher yang dibeli sudah digunakan."
    );
  });

  it("should allow cancellation if all 12 vouchers are untouched, voiding all vouchers", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-vp-ok",
      status: "COMPLETED",
      createdAt: new Date(),
      items: [],
      voucherRedemptions: [],
    });

    // 12 vouchers purchased: all 12 untouched
    const mockVouchers = Array.from({ length: 12 }, (_, i) => ({
      id: `v-${i + 1}`,
      status: "ACTIVE",
      initialVisitCount: 1,
      remainingVisitCount: 1,
      redemptions: [],
    }));

    mockTx.customerVoucher.findMany.mockResolvedValue(mockVouchers);

    const result = await PosTransactionRepository.cancelTransaction("tx-vp-ok");

    expect(result.success).toBe(true);
    expect(mockTx.customerVoucher.updateMany).toHaveBeenCalledWith({
      where: { sourceTransactionId: "tx-vp-ok" },
      data: { status: "VOID" },
    });
    expect(mockTx.transaction.update).toHaveBeenCalledWith({
      where: { id: "tx-vp-ok" },
      data: { status: "CANCELLED" },
    });
  });
});
