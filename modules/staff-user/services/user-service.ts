import { UserRepository } from "../repositories/user-repository"

export class UserService {
  static async getAllUsers() {
    return await UserRepository.getAllUsers()
  }
}
