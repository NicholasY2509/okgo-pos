import { prisma } from './lib/prisma'
async function main() {
  const staffUsers = await prisma.staffUser.count();
  const branchUsers = await prisma.branchUser.count();
  const staff = await prisma.staff.count();
  const users = await prisma.user.count();
  console.log({ staffUsers, branchUsers, staff, users });
  
  const sampleStaff = await prisma.staff.findFirst({ include: { staffUsers: true, branch: true } });
  console.log("Sample Staff:", sampleStaff);
}
main().catch(console.error).finally(() => prisma.$disconnect());
