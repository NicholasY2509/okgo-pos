import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractSubdomain } from "@/lib/subdomain"

const PWA_ICONS = [
  {
    src: "/icons/icon-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    src: "/icons/icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
]

export async function GET(request: NextRequest) {
  const hostname =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""

  const subdomain = extractSubdomain(hostname)

  // Marketing / root domain is not a PWA
  if (!subdomain) {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const isAdmin = subdomain === "admin"

  let manifestName = "Nyenyak Admin"
  let shortName = "Nyenyak Admin"
  let description = "Portal Administrasi Nyenyak POS"
  let startUrl = "/"

  if (!isAdmin) {
    const branch = await prisma.branch.findUnique({
      where: { subdomain },
      select: { name: true },
    })

    const branchName =
      branch?.name ||
      subdomain.charAt(0).toUpperCase() + subdomain.slice(1)

    manifestName = `Nyenyak POS - ${branchName}`
    shortName = branchName
    description = `Point of Sale & Operasional Cabang ${branchName}`
    startUrl = "/pos"
  }

  const manifest = {
    name: manifestName,
    short_name: shortName,
    description,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: PWA_ICONS,
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-store",
    },
  })
}
