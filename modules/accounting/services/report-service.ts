import { ReportRepository } from "../repositories/report-repository"

export class ReportService {
  /**
   * Calculates the normal balance of an account based on its type.
   * ASSET, EXPENSE -> Debit normal balance (Debit - Credit)
   * LIABILITY, EQUITY, REVENUE -> Credit normal balance (Credit - Debit)
   */
  static getNormalBalance(account: any, totalDebit: number, totalCredit: number) {
    if (['ASSET', 'EXPENSE'].includes(account.type)) {
      return totalDebit - totalCredit;
    } else {
      return totalCredit - totalDebit;
    }
  }

  static async generateProfitAndLoss(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
    const balances = await ReportRepository.getAccountBalances({
      ...options,
      accountTypes: ['REVENUE', 'EXPENSE']
    });

    const revenues = balances
      .filter(b => b.account.type === 'REVENUE')
      .map(b => ({
        ...b.account,
        balance: this.getNormalBalance(b.account, b.totalDebit, b.totalCredit)
      }));

    const expenses = balances
      .filter(b => b.account.type === 'EXPENSE')
      .map(b => ({
        ...b.account,
        balance: this.getNormalBalance(b.account, b.totalDebit, b.totalCredit)
      }));

    const totalRevenue = revenues.reduce((sum, r) => sum + r.balance, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    return {
      revenues,
      expenses,
      totalRevenue,
      totalExpense,
      netIncome
    };
  }

  static async generateBalanceSheet(options: { asOfDate?: Date; branchId?: string; tenantId?: string }) {
    // 1. Get all Assets, Liabilities, and Equity balances up to the given date
    const balances = await ReportRepository.getAccountBalances({
      ...options,
      accountTypes: ['ASSET', 'LIABILITY', 'EQUITY']
    });

    const assets = balances
      .filter(b => b.account.type === 'ASSET')
      .map(b => ({
        ...b.account,
        balance: this.getNormalBalance(b.account, b.totalDebit, b.totalCredit)
      }));

    const liabilities = balances
      .filter(b => b.account.type === 'LIABILITY')
      .map(b => ({
        ...b.account,
        balance: this.getNormalBalance(b.account, b.totalDebit, b.totalCredit)
      }));

    const equity = balances
      .filter(b => b.account.type === 'EQUITY')
      .map(b => ({
        ...b.account,
        balance: this.getNormalBalance(b.account, b.totalDebit, b.totalCredit)
      }));

    // 2. Calculate Retained Earnings (Historical Net Income up to asOfDate)
    const historicalPnL = await ReportRepository.getAccountBalances({
      asOfDate: options.asOfDate,
      branchId: options.branchId,
      tenantId: options.tenantId,
      accountTypes: ['REVENUE', 'EXPENSE']
    });

    let historicalRevenue = 0;
    let historicalExpense = 0;

    for (const b of historicalPnL) {
      if (b.account.type === 'REVENUE') {
        historicalRevenue += this.getNormalBalance(b.account, b.totalDebit, b.totalCredit);
      } else if (b.account.type === 'EXPENSE') {
        historicalExpense += this.getNormalBalance(b.account, b.totalDebit, b.totalCredit);
      }
    }

    const retainedEarnings = historicalRevenue - historicalExpense;

    // Add retained earnings to equity section virtually
    equity.push({
      id: 'retained-earnings',
      code: '399',
      name: 'Laba Ditahan (Retained Earnings)',
      type: 'EQUITY',
      description: 'Historical net income',
      isLocked: true,
      balance: retainedEarnings,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: options.tenantId || null,
      branchId: options.branchId || null
    });

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity
    };
  }

  static async generateTrialBalance(options: { startDate?: Date; endDate?: Date; branchId?: string; tenantId?: string }) {
    // Need all accounts, even if zero movement, to show complete COA, but usually only non-zero are shown.
    const allAccounts = await ReportRepository.getAllAccounts(options.branchId, options.tenantId);
    
    // Determine opening balance (if a date range is given)
    // Opening balance is all entries BEFORE the startDate
    const openingBalances = options.startDate ? await ReportRepository.getAccountBalances({
      asOfDate: new Date(options.startDate.getTime() - 1), // 1 ms before startDate
      branchId: options.branchId,
      tenantId: options.tenantId
    }) : [];

    // Period movement
    const periodMovements = await ReportRepository.getAccountBalances({
      startDate: options.startDate,
      endDate: options.endDate,
      branchId: options.branchId,
      tenantId: options.tenantId
    });

    const trialBalanceLines = allAccounts.map(account => {
      const opening = openingBalances.find(ob => ob.account.id === account.id);
      const movement = periodMovements.find(pm => pm.account.id === account.id);

      const openingDebit = opening?.totalDebit || 0;
      const openingCredit = opening?.totalCredit || 0;
      const openingNormalBalance = this.getNormalBalance(account, openingDebit, openingCredit);

      const movementDebit = movement?.totalDebit || 0;
      const movementCredit = movement?.totalCredit || 0;

      // Closing balance
      const totalDebit = openingDebit + movementDebit;
      const totalCredit = openingCredit + movementCredit;
      const closingNormalBalance = this.getNormalBalance(account, totalDebit, totalCredit);

      return {
        account,
        openingBalance: openingNormalBalance,
        movementDebit,
        movementCredit,
        closingBalance: closingNormalBalance,
        isZero: openingNormalBalance === 0 && movementDebit === 0 && movementCredit === 0 && closingNormalBalance === 0
      };
    }).filter(line => !line.isZero); // Filter out accounts with absolute zero activity

    const totalMovementDebit = trialBalanceLines.reduce((sum, line) => sum + line.movementDebit, 0);
    const totalMovementCredit = trialBalanceLines.reduce((sum, line) => sum + line.movementCredit, 0);

    return {
      lines: trialBalanceLines,
      totalMovementDebit,
      totalMovementCredit,
      isBalanced: Math.abs(totalMovementDebit - totalMovementCredit) < 0.01
    };
  }

  static async generateDailyReport(date: Date, branchId?: string, tenantId?: string) {
    return await ReportRepository.getDailySummary(date, branchId, tenantId);
  }
}
