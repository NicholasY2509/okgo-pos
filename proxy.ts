import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl
  
  // Get hostname of request (e.g. downtown.okgo.com, localhost:3000)
  const hostname = req.headers.get("host") || ""

  // We only care about subdomains if it's not the main domain (e.g. okgo.com or admin.okgo.com)
  // For local development, we extract the part before localhost
  // Note: Adjust this logic based on your production root domain
  let subdomain = ""
  
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".")
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  } else {
    // Production domain parsing
    const parts = hostname.split(".")
    // Assuming root domain is okgo.com (2 parts)
    if (parts.length > 2 && parts[0] !== "www") {
      subdomain = parts[0]
    }
  }

  const searchParams = req.nextUrl.searchParams.toString()
  const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`

  // Handle the "admin" subdomain explicitly
  if (subdomain === "admin") {
    // If the path already starts with /admin, don't rewrite it again (prevents /admin/admin/...)
    if (url.pathname.startsWith("/admin")) {
      return NextResponse.next()
    }
    // Rewrite admin.localhost:3000/ to /admin/
    return NextResponse.rewrite(new URL(`/admin${path}`, req.url))
  }

  // If there is no subdomain (or it's www), route normally
  if (!subdomain || subdomain === "www") {
    return NextResponse.next()
  }

  // Rewrite to the branch app directory, passing the subdomain
  // e.g., downtown.localhost:3000/login -> /downtown/login
  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url))
}
