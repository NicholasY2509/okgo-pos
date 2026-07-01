import { RoomInput } from "../schemas/room-schema";
import { RoomRepository } from "../repositories/room-repository";

export class RoomService {
  static async getAll() {
      return await RoomRepository.getAll();
  }

  static async getById(id: string) {
      return await RoomRepository.getById(id);
  }

  static async getByBranchId(branchId: string) {
      return await RoomRepository.getByBranchId(branchId);
  }

  static async getActiveByBranchId(branchId: string) {
      return await RoomRepository.getActiveByBranchId(branchId);
  }

  static async create(data: RoomInput) {
      return await RoomRepository.create(data);
  }

  static async update(id: string, data: RoomInput) {
      return await RoomRepository.update(id, data);
  }

  static async delete(id: string) {
      return await RoomRepository.delete(id);
  }
}
