import {
  CreateWorkPositionInput,
  UpdateWorkPositionInput,
} from "../schemas/work-position-schema"
import { WorkPositionRepository } from "../repositories/work-position-repository";

export class WorkPositionService {
  static async getAllWorkPositions() {
      return await WorkPositionRepository.getAllWorkPositions();
  }

  static async getWorkPositionById(id: string) {
      return await WorkPositionRepository.getWorkPositionById(id);
  }

  static async createWorkPosition(data: CreateWorkPositionInput) {
      return await WorkPositionRepository.createWorkPosition(data);
  }

  static async updateWorkPosition(id: string, data: Omit<UpdateWorkPositionInput, "id">) {
      return await WorkPositionRepository.updateWorkPosition(id, data);
  }

  static async deleteWorkPosition(id: string) {
      return await WorkPositionRepository.deleteWorkPosition(id);
  }
}
