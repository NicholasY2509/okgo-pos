import bcrypt from "bcryptjs"
import { KioskRepository } from "../repositories/kiosk-repository"
import { KioskLoginInput } from "../schemas/kiosk-schema"

export class KioskService {
  static async verifyPin(data: KioskLoginInput) {
    const staff = await KioskRepository.getStaffByUsername(data.username)

    if (!staff || !staff.pinHash) {
      throw new Error("Invalid username or PIN")
    }

    if (!staff.isActive) {
      throw new Error("This staff account is inactive")
    }

    const isValid = await bcrypt.compare(data.pin, staff.pinHash)

    if (!isValid) {
      throw new Error("Invalid username or PIN")
    }

    return staff
  }
}
