import { prisma } from "@/lib/prisma";

export const InvoiceRepository = {
  async getInvoiceData(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: true,
        items: {
          include: {
            serviceSessions: true,
          },
        },
        payments: {
          include: {
            paymentMethod: true,
          },
        },
        voucherRedemptions: {
          include: {
            customerVoucher: {
              include: {
                voucherPacket: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) return null;

    // Fetch branch info
    const branch = await prisma.branch.findUnique({
      where: { id: transaction.branchId },
    });

    // Fetch cashier info if available
    let cashierName: string | null = null;
    if (transaction.cashierId) {
      const staff = await prisma.staff.findUnique({
        where: { id: transaction.cashierId },
        select: { firstName: true, lastName: true },
      });
      if (staff) {
        cashierName = `${staff.firstName} ${staff.lastName || ""}`.trim();
      } else {
        const user = await prisma.user.findUnique({
          where: { id: transaction.cashierId },
          select: { name: true },
        });
        if (user) cashierName = user.name;
      }
    }

    // Fetch vouchers generated from this transaction
    const generatedVouchers = await prisma.customerVoucher.findMany({
      where: { sourceTransactionId: transaction.id },
      include: {
        voucherPacket: true,
      },
    });

    return {
      transaction,
      branch,
      cashierName,
      generatedVouchers,
    };
  },
};

