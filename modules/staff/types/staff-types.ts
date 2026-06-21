import { Prisma } from "@/lib/generated/prisma"

export type Staff = Prisma.StaffGetPayload<{}>

export type StaffWithRelations = Prisma.StaffGetPayload<{
  include: {
    workPosition: true
    branch: true
    staffUsers: true
  }
}>
