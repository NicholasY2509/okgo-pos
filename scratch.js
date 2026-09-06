const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function run() {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      include: { category: true }, orderBy: { name: 'asc' }
    });
    console.log("Branches:", branches);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
