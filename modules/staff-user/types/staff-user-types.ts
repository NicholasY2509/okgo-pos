import { Prisma } from "@/lib/generated/prisma"

export type StaffUser = Prisma.StaffUserGetPayload<{}>

export type StaffUserWithRelations = Prisma.StaffUserGetPayload<{
  include: {
    staff: true
    user: true
  }
}>
