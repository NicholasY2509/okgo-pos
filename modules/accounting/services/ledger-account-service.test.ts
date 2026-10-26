import { describe, it, expect, vi, beforeEach } from "vitest";
import { LedgerAccountService } from "./ledger-account-service";
import { LedgerAccountRepository } from "../repositories/ledger-account-repository";

describe("LedgerAccountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass tenantId and branchId to LedgerAccountRepository.findAllWithBalances", async () => {
    const mockAccountsWithBalances = [
      { id: "acc-101", code: "101", name: "Kas Tunai", type: "ASSET", balance: 1500000 },
      { id: "acc-111", code: "111", name: "Bank", type: "ASSET", balance: 5000000 },
    ];

    const spyFindAll = vi.spyOn(LedgerAccountRepository, "findAllWithBalances").mockResolvedValue(mockAccountsWithBalances as any);

    const result = await LedgerAccountService.getAllWithBalances("tenant-1", "branch-1");

    expect(spyFindAll).toHaveBeenCalledWith("tenant-1", "branch-1");
    expect(result).toEqual(mockAccountsWithBalances);
  });

  it("should support calling getAllWithBalances without branchId for global view", async () => {
    const mockAccounts = [
      { id: "acc-101", code: "101", name: "Kas Tunai", type: "ASSET", balance: 10000000 },
    ];

    const spyFindAll = vi.spyOn(LedgerAccountRepository, "findAllWithBalances").mockResolvedValue(mockAccounts as any);

    const result = await LedgerAccountService.getAllWithBalances();

    expect(spyFindAll).toHaveBeenCalledWith(undefined, undefined);
    expect(result).toEqual(mockAccounts);
  });
});
