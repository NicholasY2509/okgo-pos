import { prisma } from "@/lib/prisma";
import { TimetableClient } from "@/modules/pos/components/timetable-client";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TimetablePage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;

  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant }
  });

  if (!branch) {
    notFound();
  }

  const rooms = await prisma.room.findMany({
    where: { branchId: branch.id, isActive: true },
    orderBy: { name: 'asc' }
  });

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <TimetableClient
      branchId={branch.id}
      rooms={rooms}
      paymentMethods={paymentMethods}
    />
  );
}
