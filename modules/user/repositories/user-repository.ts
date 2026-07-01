import { prisma } from "@/lib/prisma";
import { CreateUserInput, UpdateUserInput } from "../schemas/user-schema";
import bcrypt from "bcryptjs";

export let UserRepository = {
    getAllUsers: async () => {
        return await prisma.user.findMany({
          orderBy: { name: 'asc' },
          include: {
            staffUsers: {
              include: {
                staff: {
                  include: {
                    branchStaffs: {
                      include: {
                        branch: true,
                        role: true
                      }
                    }
                  }
                }
              }
            }
          }
        })
        },
    createUser: async (data: CreateUserInput) => {
        const hashedPassword = await bcrypt.hash(data.password, 10)
        return await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
          },
        })
        },
    updateUser: async (id: string, data: Omit<UpdateUserInput, 'id'>) => {
        const updateData: any = {
          name: data.name,
          email: data.email,
        }

        if (data.password && data.password.length > 0) {
          updateData.password = await bcrypt.hash(data.password, 10)
        }

        return await prisma.user.update({
          where: { id },
          data: updateData,
        })
        },
    deleteUser: async (id: string) => {
        // Delete all related staffUsers first if needed
        await prisma.staffUser.deleteMany({
          where: { userId: id }
        })
        return await prisma.user.delete({
          where: { id },
        })
        }
};
