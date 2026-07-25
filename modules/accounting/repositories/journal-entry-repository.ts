import { prisma } from "@/lib/prisma"
import { JournalEntryInput } from "../schemas/journal-entry"

export const JournalEntryRepository = {
  async create(data: JournalEntryInput & { tenantId?: string }) {
    return await prisma.journalEntry.create({
      data: {
        date: data.date,
        description: data.description,
        reference: data.reference,
        branchId: data.branchId,
        tenantId: data.tenantId,
        lines: {
          create: data.lines.map(line => ({
            ledgerAccountId: line.ledgerAccountId,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            ledgerAccount: true,
          },
        },
      },
    })
  },

  async findAll(branchId?: string, tenantId?: string) {
    return await prisma.journalEntry.findMany({
      where: { 
        ...(branchId ? { branchId } : {}),
        tenantId 
      },
      include: {
        lines: {
          include: {
            ledgerAccount: true,
          },
        },
      },
      orderBy: { date: "desc" },
    })
  },

  async findById(id: string) {
    return await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            ledgerAccount: true,
          },
        },
      },
    })
  },

  async delete(id: string) {
    return await prisma.journalEntry.delete({
      where: { id },
    })
  },
}
