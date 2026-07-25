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

  // Validate that the subdomain actually exists in the database
  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant }
  })

  // If the branch doesn't exist, immediately trigger a 404 Not Found
  if (!branch) {
    notFound()
  }

  return <>{children}</>;
}
