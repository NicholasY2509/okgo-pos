import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const components = await prisma.salaryComponent.findMany();
  return NextResponse.json(components);
}
