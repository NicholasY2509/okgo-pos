import { prisma } from "@/lib/prisma"
import {
  CreateWorkPositionInput,
  UpdateWorkPositionInput,
} from "../schemas/work-position-schema"

export class WorkPositionService {
  static async getAllWorkPositions() {
    return await prisma.workPosition.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { staff: true },
        },
      },
    })
  }

  static async getWorkPositionById(id: string) {
    return await prisma.workPosition.findUnique({
      where: { id },
    })
  }

  static async createWorkPosition(data: CreateWorkPositionInput) {
    return await prisma.workPosition.create({
      data,
    })
  }

  static async updateWorkPosition(id: string, data: Omit<UpdateWorkPositionInput, "id">) {
    return await prisma.workPosition.update({
      where: { id },
      data,
    })
  }

  static async deleteWorkPosition(id: string) {
    return await prisma.workPosition.delete({
      where: { id },
    })
  }
}
