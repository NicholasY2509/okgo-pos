import {
  CreateStaffInput,
  UpdateStaffInput,
} from "../schemas/staff-schema"
import { StaffRepository } from "../repositories/staff-repository"
import bcrypt from "bcryptjs"

export interface GetStaffParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
}

export class StaffService {
  // --- Staff ---

  static async getAllStaffPaginated({ page = 1, limit = 10, search, branchId }: GetStaffParams = {}) {
    const skip = (page - 1) * limit;

    const where = {
      ...(branchId && { branchStaffs: { some: { branchId } } }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ]
      }),
    };

    const [staff, total] = await Promise.all([
      StaffRepository.findManyWithFilter(where, skip, limit),
      StaffRepository.count(where),
    ]);

    return {
      staff,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getAllStaff(branchId?: string, serviceId?: string) {
    return await StaffRepository.getAllStaff(branchId, serviceId)
  }

  static async getActiveStaff(branchId: string) {
    return await StaffRepository.getActiveStaff(branchId)
  }

  static async getStaffById(id: string) {
    return await StaffRepository.getStaffById(id)
  }

  static async createStaff(data: CreateStaffInput) {
    if (!data.staffIdNumber) {
      const lastStaff = await StaffRepository.getLastStaffIdNumber()
      let nextNumber = 1
      if (lastStaff?.staffIdNumber) {
        const lastNumberStr = lastStaff.staffIdNumber.replace("STF-", "")
        const lastNumber = parseInt(lastNumberStr, 10)
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1
        }
      }
      data.staffIdNumber = `STF-${String(nextNumber).padStart(3, "0")}`
    }

    const { pin, ...staffData } = data
    const payload: any = { ...staffData }
    if (pin) {
      payload.pinHash = await bcrypt.hash(pin, 10)
    }

    return await StaffRepository.createStaff(payload)
  }

  static async updateStaff(id: string, data: Omit<UpdateStaffInput, "id">) {
    const { pin, ...staffData } = data
    const payload: any = { ...staffData }
    if (pin) {
      payload.pinHash = await bcrypt.hash(pin, 10)
    } else if (pin === "") {
      // If pin is explicitly empty, we could remove the pin, but usually we just don't update it unless provided.
      // So if it's empty, we do nothing to pinHash.
    }

    return await StaffRepository.updateStaff(id, payload)
  }

  static async deleteStaff(id: string) {
    return await StaffRepository.deleteStaff(id)
  }
}
