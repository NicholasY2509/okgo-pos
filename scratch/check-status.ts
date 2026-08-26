import pkg from "@prisma/client"
const { PrismaClient } = pkg
const prisma = new PrismaClient()
async function main() {
  const statuses = await prisma.attendanceStatus.findMany()
  console.log(statuses)
}
main()
