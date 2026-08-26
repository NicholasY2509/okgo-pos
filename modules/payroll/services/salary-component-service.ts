import { SalaryComponentRepository } from "../repositories/salary-component-repository"
import { SalaryComponentInput, UpdateSalaryComponentInput } from "../schemas/salary-component"

export class SalaryComponentService {
  static async getAll() {
    return await SalaryComponentRepository.getAll()
  }

  static async create(data: SalaryComponentInput) {
    // Check if code already exists
    const existing = await SalaryComponentRepository.getByCode(data.code)
    if (existing) {
      throw new Error(`Komponen dengan kode ${data.code} sudah ada.`)
    }

    return await SalaryComponentRepository.create(data)
  }

  static async update(data: UpdateSalaryComponentInput) {
    const existing = await SalaryComponentRepository.getById(data.id)
    if (!existing) {
      throw new Error("Komponen tidak ditemukan.")
    }

    // Check code uniqueness if changed
    if (existing.code !== data.code) {
      const existingCode = await SalaryComponentRepository.getByCode(data.code)
      if (existingCode) {
        throw new Error(`Komponen dengan kode ${data.code} sudah ada.`)
      }
    }

    return await SalaryComponentRepository.update(data.id, data)
  }

  static async delete(id: string) {
    const existing = await SalaryComponentRepository.getById(id)
    if (!existing) {
      throw new Error("Komponen tidak ditemukan.")
    }

    return await SalaryComponentRepository.delete(id)
  }
}
