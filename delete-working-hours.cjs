const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.attendanceWorkingHour.deleteMany({});
  await prisma.workingHour.deleteMany({});
  console.log("Deleted all working hours and attendance data.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
