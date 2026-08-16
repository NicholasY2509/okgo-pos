import { prisma } from "@/lib/prisma"

export const KioskRepository = {
  async getStaffByUsername(username: string) {
    return await prisma.staff.findUnique({
      where: { username },
      include: { workPosition: true, branchStaffs: true }
    })
  }
}
