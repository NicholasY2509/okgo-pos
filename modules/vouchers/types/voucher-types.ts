import { Prisma } from "@/lib/generated/prisma"

export type VoucherPacket = Prisma.VoucherPacketGetPayload<{}>

export type VoucherPacketWithProduct = Prisma.VoucherPacketGetPayload<{
  include: {
    product: true
  }
}>
