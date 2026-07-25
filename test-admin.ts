import { prisma } from "./lib/prisma"

async function main() {
  const user = await prisma.user.findUnique({ where: { email: "admin@example.com" } })
  console.log("User:", user)

  const allBranchStaffs = await prisma.branchStaff.findMany({ include: { staff: true, branch: true } })
  console.log("All branch staffs:", JSON.stringify(allBranchStaffs, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
