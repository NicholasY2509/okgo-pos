import { MarketingOfferRepository } from "../repositories/marketing-offer-repository"
import { MarketingOfferInput } from "../schemas/marketing-offer"

export class MarketingOfferService {
  static async findAll() {
    return await MarketingOfferRepository.findAll()
  }

  static async findActive() {
    return await MarketingOfferRepository.findActive()
  }

  static async create(data: MarketingOfferInput) {
    return await MarketingOfferRepository.create(data)
  }

  static async update(id: string, data: MarketingOfferInput) {
    const existing = await MarketingOfferRepository.findById(id)
    if (!existing) {
      throw new Error("Marketing offer not found")
    }
    return await MarketingOfferRepository.update(id, data)
  }

  static async delete(id: string) {
    const existing = await MarketingOfferRepository.findById(id)
    if (!existing) {
      throw new Error("Marketing offer not found")
    }
    return await MarketingOfferRepository.delete(id)
  }
}
