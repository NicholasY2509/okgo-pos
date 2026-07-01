import { CustomerInput } from "../schemas/customer-schema";
import { CustomerRepository } from "../repositories/customer-repository";

export class CustomerService {
  static async create(data: CustomerInput) {
    return await CustomerRepository.create(data);
  }

  static async update(id: string, data: CustomerInput) {
    return await CustomerRepository.update(id, data);
  }

  static async getAll() {
    return await CustomerRepository.getAll();
  }

  static async searchCustomers(query: string = "", page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const whereClause = query
      ? {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      CustomerRepository.findManyWithFilter(whereClause, skip, limit),
      CustomerRepository.count(whereClause),
    ]);

    return {
      data,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  static async getById(id: string) {
    return await CustomerRepository.getById(id);
  }

  static async delete(id: string) {
    return await CustomerRepository.delete(id);
  }
}
