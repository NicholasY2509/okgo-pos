import { Discount as PrismaDiscount, Branch as PrismaBranch } from "@/lib/generated/prisma"

export type Discount = Omit<PrismaDiscount, "percentage"> & { percentage: number | any }
export type Branch = PrismaBranch

export type DiscountWithBranch = Discount & {
  branch: Branch | null
}
