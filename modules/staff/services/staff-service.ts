import {
  CreateStaffInput,
  RegisterStaffFaceInput,
  UpdateStaffInput,
} from "../schemas/staff-schema"
import { StaffRepository } from "../repositories/staff-repository"
import { Prisma } from "@/lib/generated/prisma"
import bcrypt from "bcryptjs"

export interface PortalStaffFaceProfile {
  id: string
  name: string
  firstName: string
  lastName: string
  staffIdNumber: string | null
  position: string
  imageUrl: string | null
  hasFaceRegistered: boolean
  faceEmbedding: number[] | null
  faceRegisteredAt: string | null
}

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

  static async getAllStaff(branchId?: string, serviceId?: string, excludeSessionId?: string, startTime?: Date) {
    return await StaffRepository.getAllStaff(branchId, serviceId, excludeSessionId, startTime)
  }

  static async getActiveStaff(branchId?: string) {
    return await StaffRepository.getActiveStaff(branchId)
  }

  static async getStaffById(id: string) {
    return await StaffRepository.getStaffById(id)
  }

  static async getActiveStaffIds() {
    return await StaffRepository.getActiveStaffIds()
  }

  static async getActiveStaffForExport() {
    return await StaffRepository.getActiveStaffForExport()
  }

  static async getMatchingStaffIds({ search, branchId }: { search?: string; branchId?: string } = {}) {
    const where: Prisma.StaffWhereInput = {
      ...(branchId && { branchStaffs: { some: { branchId } } }),
      ...(search && {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ]
      }),
    }
    return await StaffRepository.findStaffIds(where)
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
    const payload: any = {
      ...staffData,
      username: staffData.username?.trim() ? staffData.username.trim() : null,
      phone: staffData.phone?.trim() ? staffData.phone.trim() : null,
      email: staffData.email?.trim() ? staffData.email.trim() : null,
      level: staffData.level?.trim() ? staffData.level.trim() : null,
    }
    if (pin) {
      payload.pinHash = await bcrypt.hash(pin, 10)
    }

    return await StaffRepository.createStaff(payload)
  }

  static async updateStaff(id: string, data: Omit<UpdateStaffInput, "id">) {
    const { pin, ...staffData } = data
    const payload: any = {
      ...staffData,
      ...(staffData.username !== undefined && {
        username: staffData.username?.trim() ? staffData.username.trim() : null,
      }),
      ...(staffData.phone !== undefined && {
        phone: staffData.phone?.trim() ? staffData.phone.trim() : null,
      }),
      ...(staffData.email !== undefined && {
        email: staffData.email?.trim() ? staffData.email.trim() : null,
      }),
      ...(staffData.level !== undefined && {
        level: staffData.level?.trim() ? staffData.level.trim() : null,
      }),
    }
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

  static async getBranchHrisRoster(branchId: string) {
    return await StaffRepository.getBranchHrisRoster(branchId)
  }

  static normalizeFaceEmbedding(embedding: number[]): number[] {
    let sumSquares = 0
    for (let i = 0; i < embedding.length; i++) {
      sumSquares += embedding[i] * embedding[i]
    }
    const norm = Math.sqrt(sumSquares)
    if (!Number.isFinite(norm) || norm <= 1e-8) {
      throw new Error("Vektor wajah tidak valid (norma nol).")
    }
    return embedding.map((v) => Number((v / norm).toFixed(6)))
  }

  private static parseFaceEmbedding(raw: unknown): number[] | null {
    if (!Array.isArray(raw) || raw.length === 0) return null
    const values: number[] = []
    for (const item of raw) {
      if (typeof item !== "number" || !Number.isFinite(item)) {
        return null
      }
      values.push(item)
    }
    return values
  }

  private static mapPortalStaffFaceProfile(record: {
    id: string
    firstName: string
    lastName: string
    staffIdNumber: string | null
    imageUrl: string | null
    faceEmbedding: unknown
    faceRegisteredAt: Date | null
    workPosition?: { name: string } | null
  }): PortalStaffFaceProfile {
    const embedding = StaffService.parseFaceEmbedding(record.faceEmbedding)
    return {
      id: record.id,
      name: `${record.firstName} ${record.lastName}`.trim(),
      firstName: record.firstName,
      lastName: record.lastName,
      staffIdNumber: record.staffIdNumber ?? null,
      position: record.workPosition?.name ?? "Staf",
      imageUrl: record.imageUrl ?? null,
      hasFaceRegistered: embedding !== null && embedding.length >= 64,
      faceEmbedding: embedding,
      faceRegisteredAt: record.faceRegisteredAt
        ? record.faceRegisteredAt.toISOString()
        : null,
    }
  }

  static async getBranchStaffFaceProfiles(
    branchId: string
  ): Promise<PortalStaffFaceProfile[]> {
    const records = await StaffRepository.getBranchStaffFaceProfiles(branchId)
    return records.map(StaffService.mapPortalStaffFaceProfile)
  }

  static async registerStaffFace(
    input: RegisterStaffFaceInput
  ): Promise<PortalStaffFaceProfile> {
    const staffMember = await StaffRepository.getBranchStaffMember(
      input.staffId,
      input.branchId
    )
    if (!staffMember) {
      throw new Error("Staf tidak ditemukan atau tidak terdaftar pada cabang ini.")
    }

    const normalizedEmbedding = StaffService.normalizeFaceEmbedding(input.embedding)
    const updated = await StaffRepository.saveStaffFaceEmbedding(
      input.staffId,
      normalizedEmbedding,
      new Date()
    )
    return StaffService.mapPortalStaffFaceProfile(updated)
  }
}
