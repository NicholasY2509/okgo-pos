import { CreateRoleInput, UpdateRoleInput } from "../schemas/role-schema"
import { RoleRepository } from "../repositories/role-repository";

export class RoleService {
  static async getAllRoles() {
      return await RoleRepository.getAllRoles();
  }

  static async getRoleById(id: string) {
      return await RoleRepository.getRoleById(id);
  }

  static async createRole(data: CreateRoleInput) {
      return await RoleRepository.createRole(data);
  }

  static async updateRole(id: string, data: Omit<UpdateRoleInput, "id">) {
      return await RoleRepository.updateRole(id, data);
  }

  static async deleteRole(id: string) {
      return await RoleRepository.deleteRole(id);
  }
}
