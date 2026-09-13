import "dotenv/config";
import { PrismaClient } from "./generated/prisma";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const connectionString = process.env.DATABASE_URL || "mysql://dummy:dummy@localhost:3306/dummy";

const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  adapter: PrismaMariaDb;
};

const adapter = globalForPrisma.adapter || new PrismaMariaDb(connectionString);
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}
