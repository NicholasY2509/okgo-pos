import { Prisma } from "@/lib/generated/prisma"

export type User = Prisma.UserGetPayload<{}>

export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    branchUsers: true
    staffUsers: true
  }
}>
