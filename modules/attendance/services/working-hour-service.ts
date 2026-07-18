import { WorkingHourRepository } from "../repositories/working-hour-repository";
import type { WorkingHourInput } from "../schemas/working-hour";

export class WorkingHourService {
  static async getAll() {
    return await WorkingHourRepository.findMany();
  }

  static async getById(id: string) {
    return await WorkingHourRepository.findById(id);
  }

  static async create(data: WorkingHourInput) {
    // We could add extra business logic here, like checking if clockIn < clockOut
    // to flag night shifts, but for now we just pass it to the repo.
    return await WorkingHourRepository.create(data);
  }

  static async update(id: string, data: WorkingHourInput) {
    return await WorkingHourRepository.update(id, data);
  }

  static async delete(id: string) {
    return await WorkingHourRepository.delete(id);
  }
}
