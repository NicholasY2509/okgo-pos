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

vi.mock("../services/pos-utils", () => ({
  PosUtils: {
    generateTransactionNumber: vi.fn().mockReturnValue("INV-REOPEN-001"),
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
        create: vi.fn().mockResolvedValue({ id: "tx-reopen-1", transactionNumber: "INV-REOPEN-001", status: "PENDING" }),
      },
      transactionItem: {
        create: vi.fn().mockResolvedValue({ id: "item-reopen-1" }),
      },
      serviceSession: {
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      serviceSessionSegment: {
        updateMany: vi.fn(),
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
      voucherRedemption: {
        deleteMany: vi.fn(),
      },
      staffIncentive: {
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
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

  it("should keep service sessions active and create a new PENDING transaction when cancelling a COMPLETED transaction paid with voucher", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-paid-voucher",
      tenantId: "t-1",
      branchId: "b-1",
      customerId: "c-1",
      cashierId: "u-1",
      status: "COMPLETED",
      isVip: false,
      createdAt: new Date(),
      items: [
        {
          id: "item-1",
          type: "SERVICE",
          serviceId: "svc-1",
          voucherPacketId: null,
          itemNameSnapshot: "Full Body Massage",
          unitPrice: 200000,
          quantity: 1,
          discountAmount: 0,
          subtotal: 200000,
          serviceSessions: [{ id: "sess-1", status: "COMPLETED", bookingId: "book-1" }],
          serviceSessionSegments: [{ id: "seg-1" }],
        },
      ],
      voucherRedemptions: [
        {
          id: "red-1",
          customerVoucherId: "cv-5",
          redeemedVisitCount: 1,
          redeemedAmount: 200000,
        },
      ],
    });

    mockTx.customerVoucher.findUnique.mockResolvedValue({
      id: "cv-5",
      remainingVisitCount: 4,
      remainingCreditAmount: null,
      status: "ACTIVE",
    });

    const result = await PosTransactionRepository.cancelTransaction("tx-paid-voucher");

    expect(result.success).toBe(true);
    expect(result.reopenedTransaction).toEqual({
      id: "tx-reopen-1",
      transactionNumber: "INV-REOPEN-001",
    });
    // Must NOT cancel serviceSession or booking
    expect(mockTx.serviceSession.update).not.toHaveBeenCalled();
    expect(mockTx.booking.updateMany).not.toHaveBeenCalled();
    // Must create new PENDING transaction & re-link session, segment, and session incentive
    expect(mockTx.transaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          paidAmount: 0,
          totalAmount: 200000,
        }),
      })
    );
    expect(mockTx.serviceSession.updateMany).toHaveBeenCalledWith({
      where: { transactionItemId: "item-1" },
      data: { transactionItemId: "item-reopen-1" },
    });
    expect(mockTx.serviceSessionSegment.updateMany).toHaveBeenCalledWith({
      where: { transactionItemId: "item-1" },
      data: { transactionItemId: "item-reopen-1" },
    });
    expect(mockTx.staffIncentive.updateMany).toHaveBeenCalledWith({
      where: { transactionItemId: "item-1", serviceSessionId: { not: null } },
      data: { transactionItemId: "item-reopen-1" },
    });
    // Must restore voucher & delete VoucherRedemption so original voucher purchase can be cancelled
    expect(mockTx.customerVoucher.update).toHaveBeenCalledWith({
      where: { id: "cv-5" },
      data: {
        remainingVisitCount: 5,
        remainingCreditAmount: null,
        status: "ACTIVE",
      },
    });
    expect(mockTx.voucherRedemption.deleteMany).toHaveBeenCalledWith({
      where: { transactionId: "tx-paid-voucher" },
    });
  });

  it("should reject cancelling a PENDING transaction if any service session has started or completed", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-pending-started",
      status: "PENDING",
      createdAt: new Date(),
      items: [
        {
          id: "item-1",
          serviceSessions: [{ id: "sess-1", status: "IN_PROGRESS", bookingId: null }],
          serviceSessionSegments: [],
        },
      ],
      voucherRedemptions: [],
    });

    await expect(PosTransactionRepository.cancelTransaction("tx-pending-started")).rejects.toThrow(
      "Tidak dapat membatalkan transaksi yang belum lunas karena sesi layanan sudah dimulai atau selesai."
    );
  });

  it("should cancel SCHEDULED service sessions when cancelling a PENDING transaction", async () => {
    mockTx.transaction.findUnique.mockResolvedValue({
      id: "tx-pending-sched",
      status: "PENDING",
      createdAt: new Date(),
      items: [
        {
          id: "item-1",
          serviceSessions: [{ id: "sess-1", status: "SCHEDULED", bookingId: null }],
          serviceSessionSegments: [],
        },
      ],
      voucherRedemptions: [],
    });

    const result = await PosTransactionRepository.cancelTransaction("tx-pending-sched");

    expect(result.success).toBe(true);
    expect(result.reopenedTransaction).toBeNull();
    expect(mockTx.serviceSession.update).toHaveBeenCalledWith({
      where: { id: "sess-1" },
      data: { status: "CANCELLED" },
    });
  });
});
