import { prisma } from "@/lib/prisma"
import type { CreateProductInput, UpdateProductInput } from "../schemas/product-schema"

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export class ProductService {
  static async getAllProducts({ page = 1, limit = 10, search, categoryId }: GetProductsParams = {}) {
    const skip = (page - 1) * limit;

    const where = {
      ...(search && { name: { contains: search } }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: {
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProductById(id: string) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })
  }

  static async createProduct(data: CreateProductInput) {
    return await prisma.product.create({
      data,
    })
  }

  static async updateProduct(id: string, data: Omit<UpdateProductInput, "id">) {
    return await prisma.product.update({
      where: { id },
      data,
    })
  }

  static async deleteProduct(id: string) {
    return await prisma.product.delete({
      where: { id },
    })
  }
}
