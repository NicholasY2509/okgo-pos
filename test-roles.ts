import { PrismaClient } from './lib/generated/prisma/index.js'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({ include: { role: true } })
  console.log("Users:", JSON.stringify(users, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
