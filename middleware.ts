import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/modules/auth/auth.config"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static files with extensions (e.g., .webp, .png, .jpg)
     */
    '/((?!api|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}

export default NextAuth(authConfig).auth((req) => {
  const url = req.nextUrl

  // Get hostname of request (e.g. downtown.okgo.com, localhost:3000)
  const hostname = req.headers.get("host") || ""

  let subdomain = ""

  if (hostname.includes("localhost")) {
    const parts = hostname.split(".")
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  } else {
    // Production domain parsing
    const parts = hostname.split(".")
    if (parts.length > 2 && parts[0] !== "www") {
      subdomain = parts[0]
    }
  }

  // Check auth session
  const session = req.auth
  const isAuth = !!session

  // Handle the "admin" subdomain explicitly
  if (subdomain === "admin") {
    // Protect admin routes
    if (!isAuth && !url.pathname.startsWith("/login")) {
      const protocol = req.headers.get("x-forwarded-proto") || "http"
      const loginUrl = new URL("/login", `${protocol}://${hostname}`)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuth && url.pathname.startsWith("/login")) {
      const protocol = req.headers.get("x-forwarded-proto") || "http"
      const homeUrl = new URL("/", `${protocol}://${hostname}`)
      return NextResponse.redirect(homeUrl)
    }

    if (url.pathname.startsWith("/admin")) {
      return NextResponse.next()
    }
    // Rewrite admin.localhost:3000/ to /admin/
    const rewriteUrl = req.nextUrl.clone()
    rewriteUrl.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(rewriteUrl)
  }

  // If there is no subdomain (or it's www), route normally (marketing site - public)
  if (!subdomain || subdomain === "www") {
    return NextResponse.next()
  }

  // Protect tenant routes
  if (!isAuth && !url.pathname.startsWith("/login")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http"
    const loginUrl = new URL("/login", `${protocol}://${hostname}`)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuth && url.pathname.startsWith("/login")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http"
    const homeUrl = new URL("/pos", `${protocol}://${hostname}`)
    return NextResponse.redirect(homeUrl)
  }

  // Rewrite to the branch app directory, passing the subdomain
  // e.g., downtown.localhost:3000/login -> /[tenant]/login
  const rewriteUrl = req.nextUrl.clone()
  rewriteUrl.pathname = `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(rewriteUrl)
})
