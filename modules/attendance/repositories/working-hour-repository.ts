import { prisma } from "@/lib/prisma";
import type { WorkingHourInput } from "../schemas/working-hour";

export const WorkingHourRepository = {
  async findMany() {
    return prisma.workingHour.findMany({
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string) {
    return prisma.workingHour.findUnique({
      where: { id },
    });
  },

  async create(data: WorkingHourInput) {
    return prisma.workingHour.create({ data });
  },

  async update(id: string, data: WorkingHourInput) {
    return prisma.workingHour.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.workingHour.delete({
      where: { id },
    });
  },
};
