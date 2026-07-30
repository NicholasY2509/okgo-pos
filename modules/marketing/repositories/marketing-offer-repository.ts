import { prisma } from "@/lib/prisma"
import { MarketingOfferInput } from "../schemas/marketing-offer"

export const MarketingOfferRepository = {
  async findAll() {
    return await prisma.marketingOffer.findMany({
      orderBy: { order: "asc" },
    })
  },

  async findActive() {
    return await prisma.marketingOffer.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    })
  },

  async findById(id: string) {
    return await prisma.marketingOffer.findUnique({
      where: { id },
    })
  },

  async create(data: MarketingOfferInput) {
    return await prisma.marketingOffer.create({
      data: {
        title: data.title,
        description: data.description,
        features: data.features,
        normalPrice: data.normalPrice,
        discountPrice: data.discountPrice,
        isActive: data.isActive,
        order: data.order,
      }
    })
  },

  async update(id: string, data: MarketingOfferInput) {
    return await prisma.marketingOffer.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        features: data.features,
        normalPrice: data.normalPrice,
        discountPrice: data.discountPrice,
        isActive: data.isActive,
        order: data.order,
      }
    })
  },

  async delete(id: string) {
    return await prisma.marketingOffer.delete({
      where: { id },
    })
  }
}
