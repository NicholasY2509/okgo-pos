import { Prisma } from "@/lib/generated/prisma"

export type Account = Prisma.AccountGetPayload<{}>
export type Session = Prisma.SessionGetPayload<{}>
export type Role = Prisma.RoleGetPayload<{}>
export type Permission = Prisma.PermissionGetPayload<{}>
export type RolePermission = Prisma.RolePermissionGetPayload<{}>

export type RoleWithPermissions = Prisma.RoleGetPayload<{
  include: {
    permissions: {
      include: {
        permission: true
      }
    }
  }
}>
