import { prisma } from "@/lib/prisma"

export class UserService {
  static async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      }
    })
  }
}
