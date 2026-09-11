import { prisma } from './lib/prisma';

async function check() {
  const rooms = await prisma.room.findMany();
  const now = new Date();
  
  for (const room of rooms) {
    const activeSessions = await prisma.serviceSession.count({
      where: { 
        roomId: room.id, 
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        OR: [
          { endTime: { gt: now } },
          { endTime: null }
        ]
      }
    });
    console.log(`Room: ${room.name}, Capacity: ${room.capacity}, Active Sessions (Valid): ${activeSessions}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
