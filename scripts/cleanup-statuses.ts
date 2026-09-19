import { prisma } from "../lib/prisma"

async function main() {
  await prisma.attendanceStatus.deleteMany({
    where: {
      code: {
        in: ["PRESENT", "LATE", "ABSENT"]
      }
    }
  })
  console.log("Deleted duplicate statuses")
}
main().catch(console.error)
