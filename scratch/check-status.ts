import { PrismaClient } from "../lib/generated/prisma"
const prisma = new PrismaClient()
async function main() {
  const statuses = await prisma.attendanceStatus.findMany()
  console.log(statuses)
}
main()
