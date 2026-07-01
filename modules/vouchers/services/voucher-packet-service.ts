import { VoucherPacketInput } from "../schemas/voucher-packet"
import { VoucherPacketRepository } from "../repositories/voucher-packet-repository"

export class VoucherPacketService {
  static async create(data: VoucherPacketInput) {
    const { id, ...createData } = data
    return await VoucherPacketRepository.create(createData)
  }

  static async update(id: string, data: VoucherPacketInput) {
    const { id: _, ...updateData } = data
    return await VoucherPacketRepository.update(id, updateData)
  }

  static async delete(id: string) {
    return await VoucherPacketRepository.delete(id)
  }

  static async getByProductId(productId: string) {
    return await VoucherPacketRepository.getByProductId(productId)
  }

  static async getAll() {
    return await VoucherPacketRepository.getAll()
  }
}
