import { Prisma } from "@/lib/generated/prisma"

export type Branch = Prisma.BranchGetPayload<{}>

export type BranchWithUsers = Prisma.BranchGetPayload<{
  include: {
    users: true
    staffs: true
  }
}>
