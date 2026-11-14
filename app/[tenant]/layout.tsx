import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PwaProvider } from "@/components/pwa-provider"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>
}): Promise<Metadata> {
  const { tenant } = await params
  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant },
    select: { name: true },
  })

  const branchName =
    branch?.name || tenant.charAt(0).toUpperCase() + tenant.slice(1)

  return {
    title: {
      template: `%s | Nyenyak ${branchName}`,
      default: `Nyenyak POS - ${branchName}`,
    },
    applicationName: `Nyenyak ${branchName}`,
    manifest: "/api/manifest",
    appleWebApp: {
      title: `Nyenyak ${branchName}`,
      statusBarStyle: "default",
      capable: true,
    },
    icons: {
      apple: "/icons/apple-touch-icon.png",
    },
  }
}

export default async function TenantRootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params

  const branch = await prisma.branch.findUnique({
    where: { subdomain: tenant },
  })

  if (!branch) {
    notFound()
  }

  return <PwaProvider>{children}</PwaProvider>
}
