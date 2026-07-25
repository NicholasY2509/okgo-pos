import { prisma } from "./lib/prisma"

async function main() {
  // Find the user
  const user = await prisma.user.findUnique({ where: { email: "admin@example.com" } })
  if (!user) return console.error("No admin user")

  // Find the staff associated with the user
  const staffUser = await prisma.staffUser.findFirst({
    where: { userId: user.id },
    include: { staff: true }
  })
  if (!staffUser) return console.error("No staff user")

  const staff = staffUser.staff

  // Find the Admin Pusat role
  const role = await prisma.role.findUnique({ where: { name: "Admin Pusat" } })
  if (!role) return console.error("No admin pusat role")

  // Find a branch
  const branch = await prisma.branch.findFirst()
  if (!branch) return console.error("No branch")

  // Create the branchStaff assignment
  const assignment = await prisma.branchStaff.create({
    data: {
      staffId: staff.id,
      branchId: branch.id,
      roleId: role.id
    }
  })

  console.log("Created assignment successfully:", assignment)
}

main().catch(console.error).finally(() => prisma.$disconnect())
