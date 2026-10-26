import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalEntryAutomation } from "./journal-entry-automation";

describe("JournalEntryAutomation - Voucher Accounting (ADR-0003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should credit account 413 (Pendapatan Voucher) directly upon voucher packet purchase", async () => {
    const mockAccounts = [
      { id: "acc-101", code: "101", name: "Kas Tunai", type: "ASSET" },
      { id: "acc-111", code: "111", name: "Bank QRIS", type: "ASSET" },
      { id: "acc-411", code: "411", name: "Pendapatan Penjualan", type: "REVENUE" },
      { id: "acc-413", code: "413", name: "Pendapatan Voucher", type: "REVENUE" },
    ];

    const mockCreatedJournal = vi.fn();
    const mockTx = {
      ledgerAccount: {
        findMany: vi.fn().mockResolvedValue(mockAccounts),
      },
      journalEntry: {
        create: mockCreatedJournal,
      },
    };

    const mockTransaction = {
      id: "tx-1",
      transactionNumber: "TRX-20261018-001",
      status: "COMPLETED",
      branchId: "branch-1",
      taxTotal: 0,
      payments: [
        {
          amount: 500000,
          paymentMethod: { type: "QRIS" },
        },
      ],
      items: [
        {
          type: "VOUCHER_PACKET",
          subtotal: 500000,
        },
      ],
    };

    await JournalEntryAutomation.handleTransactionCompleted(mockTx, mockTransaction);

    expect(mockCreatedJournal).toHaveBeenCalledTimes(1);
    const createdData = mockCreatedJournal.mock.calls[0][0].data;

    expect(createdData.reference).toBe("TRX-20261018-001");
    expect(createdData.lines.create).toHaveLength(2);

    // Debit Bank QRIS (111)
    const debitLine = createdData.lines.create.find((l: any) => l.ledgerAccountId === "acc-111");
    expect(debitLine).toBeDefined();
    expect(debitLine.debit).toBe(500000);
    expect(debitLine.credit).toBe(0);

    // Credit Pendapatan Voucher (413)
    const creditLine = createdData.lines.create.find((l: any) => l.ledgerAccountId === "acc-413");
    expect(creditLine).toBeDefined();
    expect(creditLine.debit).toBe(0);
    expect(creditLine.credit).toBe(500000);
  });

  it("should fall back to account 411 if 413 is not yet seeded in database", async () => {
    const mockAccountsWithout413 = [
      { id: "acc-101", code: "101", name: "Kas Tunai", type: "ASSET" },
      { id: "acc-411", code: "411", name: "Pendapatan Penjualan", type: "REVENUE" },
    ];

    const mockCreatedJournal = vi.fn();
    const mockTx = {
      ledgerAccount: {
        findMany: vi.fn().mockResolvedValue(mockAccountsWithout413),
      },
      journalEntry: {
        create: mockCreatedJournal,
      },
    };

    const mockTransaction = {
      id: "tx-2",
      transactionNumber: "TRX-20261018-002",
      status: "COMPLETED",
      branchId: "branch-1",
      taxTotal: 0,
      payments: [
        {
          amount: 250000,
          paymentMethod: { type: "CASH" },
        },
      ],
      items: [
        {
          type: "VOUCHER_PACKET",
          subtotal: 250000,
        },
      ],
    };

    await JournalEntryAutomation.handleTransactionCompleted(mockTx, mockTransaction);

    expect(mockCreatedJournal).toHaveBeenCalledTimes(1);
    const createdData = mockCreatedJournal.mock.calls[0][0].data;

    // Credit should fall back to 411
    const creditLine = createdData.lines.create.find((l: any) => l.ledgerAccountId === "acc-411");
    expect(creditLine).toBeDefined();
    expect(creditLine.credit).toBe(250000);
  });

  it("should not create redundant journal entries on 100% voucher redemption with 0 paid amount", async () => {
    const mockAccounts = [
      { id: "acc-101", code: "101", name: "Kas Tunai", type: "ASSET" },
      { id: "acc-411", code: "411", name: "Pendapatan Penjualan", type: "REVENUE" },
      { id: "acc-413", code: "413", name: "Pendapatan Voucher", type: "REVENUE" },
    ];

    const mockCreatedJournal = vi.fn();
    const mockTx = {
      ledgerAccount: {
        findMany: vi.fn().mockResolvedValue(mockAccounts),
      },
      journalEntry: {
        create: mockCreatedJournal,
      },
    };

    // Customer used a voucher for 100% discount, subtotal is 0, paid amount is 0
    const mockTransaction = {
      id: "tx-3",
      transactionNumber: "TRX-20261018-003",
      status: "COMPLETED",
      branchId: "branch-1",
      taxTotal: 0,
      payments: [],
      items: [
        {
          type: "SERVICE",
          subtotal: 0, // 100% discounted via voucher
        },
      ],
    };

    await JournalEntryAutomation.handleTransactionCompleted(mockTx, mockTransaction);

    // No journal entry should be created since totalDebit is 0
    expect(mockCreatedJournal).not.toHaveBeenCalled();
  });

  it("should create reversal journal entry with flipped debit/credit when transaction is cancelled", async () => {
    const mockCreatedJournal = vi.fn();
    const mockTx = {
      journalEntry: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "jrn-orig-1",
            journalNumber: "JRN-20261018-001",
            reference: "TRX-20261018-001",
            description: "Penjualan POS #TRX-20261018-001",
            branchId: "branch-1",
            tenantId: "tenant-1",
            lines: [
              { ledgerAccountId: "acc-101", debit: 300000, credit: 0 },
              { ledgerAccountId: "acc-411", debit: 0, credit: 300000 },
            ],
          },
        ]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: mockCreatedJournal,
      },
    };

    const mockTransaction = {
      id: "tx-1",
      transactionNumber: "TRX-20261018-001",
      branchId: "branch-1",
      tenantId: "tenant-1",
    };

    await JournalEntryAutomation.handleTransactionCancelled(mockTx, mockTransaction);

    expect(mockCreatedJournal).toHaveBeenCalledTimes(1);
    const createdData = mockCreatedJournal.mock.calls[0][0].data;

    expect(createdData.description).toContain("Reversal / Pembatalan Penjualan POS #TRX-20261018-001");
    expect(createdData.reference).toBe("TRX-20261018-001");
    expect(createdData.lines.create).toHaveLength(2);

    // Flipped lines:
    // acc-101 (original debit 300k) should now be credit 300k
    const cashLine = createdData.lines.create.find((l: any) => l.ledgerAccountId === "acc-101");
    expect(cashLine.debit).toBe(0);
    expect(cashLine.credit).toBe(300000);

    // acc-411 (original credit 300k) should now be debit 300k
    const revLine = createdData.lines.create.find((l: any) => l.ledgerAccountId === "acc-411");
    expect(revLine.debit).toBe(300000);
    expect(revLine.credit).toBe(0);
  });

  it("should not create reversal entry if no original journal entry found", async () => {
    const mockCreatedJournal = vi.fn();
    const mockTx = {
      journalEntry: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: mockCreatedJournal,
      },
    };

    const mockTransaction = {
      id: "tx-pending",
      transactionNumber: "TRX-PENDING-001",
    };

    await JournalEntryAutomation.handleTransactionCancelled(mockTx, mockTransaction);

    expect(mockCreatedJournal).not.toHaveBeenCalled();
  });
});
