import { AssignStaffBranchInput, CreateBranchInput, UpdateBranchInput } from "../schemas/branch-schema"
import { BranchRepository } from "../repositories/branch-repository";

export class BranchService {
  static async getAllBranches() {
      return await BranchRepository.getAllBranches();
  }

  static async createBranch(data: CreateBranchInput) {
      return await BranchRepository.createBranch(data);
  }

  static async updateBranch(id: string, data: Omit<UpdateBranchInput, 'id'>) {
      return await BranchRepository.updateBranch(id, data);
  }

  static async getBranchBySubdomain(subdomain: string) {
      return await BranchRepository.getBranchBySubdomain(subdomain);
  }

  static async getBranchStaffs(branchId: string) {
      return await BranchRepository.getBranchStaffs(branchId);
  }

  static async assignStaffToBranch(data: AssignStaffBranchInput) {
      return await BranchRepository.assignStaffToBranch(data);
  }

  static async removeBranchStaff(branchStaffId: string) {
      return await BranchRepository.removeBranchStaff(branchStaffId);
  }

  static async getAllRoles() {
      return await BranchRepository.getAllRoles();
  }

  static async getAllStaffs() {
      return await BranchRepository.getAllStaffs();
  }
}
