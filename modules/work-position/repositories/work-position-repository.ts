import { prisma } from "@/lib/prisma";
import { CreateWorkPositionInput, UpdateWorkPositionInput } from "../schemas/work-position-schema";

export let WorkPositionRepository = {
    getAllWorkPositions: async () => {
        return await prisma.workPosition.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { staff: true },
            },
          },
        })
        },
    getWorkPositionById: async (id: string) => {
        return await prisma.workPosition.findUnique({
          where: { id },
        })
        },
    createWorkPosition: async (data: CreateWorkPositionInput) => {
        return await prisma.workPosition.create({
          data,
        })
        },
    updateWorkPosition: async (id: string, data: Omit<UpdateWorkPositionInput, "id">) => {
        return await prisma.workPosition.update({
          where: { id },
          data,
        })
        },
    deleteWorkPosition: async (id: string) => {
        return await prisma.workPosition.delete({
          where: { id },
        })
        }
};
