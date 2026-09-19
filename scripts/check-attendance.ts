import { prisma } from "../lib/prisma"

async function main() {
  const attendances = await prisma.attendance.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { status: true } })
  console.log(attendances.map(a => ({ date: a.attendanceDate, statusId: a.statusId, statusName: a.status?.name })))
}
main().catch(console.error)
