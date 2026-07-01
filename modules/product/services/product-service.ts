import type { CreateProductInput, UpdateProductInput } from "../schemas/product-schema"
import { ProductRepository } from "../repositories/product-repository"

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
      ProductRepository.findManyWithFilter(where, skip, limit),
      ProductRepository.count(where),
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
    return await ProductRepository.getProductById(id)
  }

  static async createProduct(data: CreateProductInput) {
    return await ProductRepository.createProduct(data)
  }

  static async updateProduct(id: string, data: Omit<UpdateProductInput, "id">) {
    return await ProductRepository.updateProduct(id, data)
  }

  static async deleteProduct(id: string) {
    return await ProductRepository.deleteProduct(id)
  }
}
