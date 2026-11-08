import "dotenv/config";
import { PrismaClient } from "./generated/prisma";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = process.env.DATABASE_URL || "mysql://dummy:dummy@localhost:3306/dummy";

const PRISMA_SCHEMA_REVISION = "2026-11-08-branch-whatsapp-instance";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  prismaRevision?: string;
  adapter: PrismaMariaDb;
};

const adapter = globalForPrisma.adapter || new PrismaMariaDb(connectionString);
export const prisma =
  globalForPrisma.prisma &&
  globalForPrisma.prismaRevision === PRISMA_SCHEMA_REVISION
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRevision = PRISMA_SCHEMA_REVISION;
  globalForPrisma.adapter = adapter;
}
