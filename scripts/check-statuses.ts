import { prisma } from "../lib/prisma"

async function main() {
  const statuses = await prisma.attendanceStatus.findMany()
  console.log(statuses)
}

main().catch(console.error)
