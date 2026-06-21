import { Prisma } from "@/lib/generated/prisma"

export type WorkPosition = Prisma.WorkPositionGetPayload<{}>

export type WorkPositionWithStaff = Prisma.WorkPositionGetPayload<{
  include: {
    staff: true
  }
}>
