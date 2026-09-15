import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function TenantRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  console.log("Tenant layout received tenant:", tenant);

  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant }
  })

  if (!branch) {
    notFound()
  }

  return <>{children}</>;
}
