import { CreateUserInput, UpdateUserInput } from "../schemas/user-schema"
import bcrypt from "bcryptjs"
import { UserRepository } from "../repositories/user-repository";

export class UserService {
  static async getAllUsers() {
      return await UserRepository.getAllUsers();
  }

  static async createUser(data: CreateUserInput) {
      return await UserRepository.createUser(data);
  }

  static async updateUser(id: string, data: Omit<UpdateUserInput, 'id'>) {
      return await UserRepository.updateUser(id, data);
  }

  static async deleteUser(id: string) {
      return await UserRepository.deleteUser(id);
  }
}
