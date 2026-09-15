import { NextResponse } from "next/server"
import NextAuth from "next-auth"
import { authConfig } from "@/modules/auth/auth.config"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - socket.io (WebSocket connections)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static files with extensions
     * - favicon.ico
     * - sitemap.xml
     * - robots.txt
     */
    "/((?!api|socket\\.io|_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}

export default NextAuth(authConfig).auth((req) => {
  const url = req.nextUrl

  // Get hostname of request
  // Examples:
  //   juanda.nyenyak.com
  //   admin.nyenyak.com
  //   nyenyak.com
  //   localhost:3000
  const hostname = req.headers.get("host") || ""

  let subdomain = ""

  /*
   * Detect subdomain
   */
  if (hostname.includes("localhost")) {
    const parts = hostname.split(".")

    // Example:
    // admin.localhost:3000 -> ["admin", "localhost:3000"]
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  } else {
    // Production:
    // juanda.nyenyak.com -> ["juanda", "nyenyak", "com"]
    // admin.nyenyak.com -> ["admin", "nyenyak", "com"]
    // nyenyak.com       -> ["nyenyak", "com"]
    const parts = hostname.split(".")

    if (parts.length > 2 && parts[0] !== "www") {
      subdomain = parts[0]
    }
  }

  // Authentication session
  const session = req.auth
  const isAuth = !!session

  /*
   * ============================================================
   * GLOBAL ROUTES
   * ============================================================
   *
   * These routes should NOT be rewritten to:
   * /{subdomain}/...
   *
   * In particular, /login must remain /login.
   */

  if (url.pathname.startsWith("/login")) {
    // Authenticated users should not access login
    if (isAuth) {
      const redirectUrl = new URL(
        subdomain && subdomain !== "www"
          ? "/pos"
          : "/",
        req.url
      )

      return NextResponse.redirect(redirectUrl)
    }

    // Unauthenticated users can access the global login page
    return NextResponse.next()
  }

  /*
   * ============================================================
   * ADMIN SUBDOMAIN
   * ============================================================
   *
   * admin.nyenyak.com
   * admin.localhost:3000
   */

  if (subdomain === "admin") {
    // Protect admin routes
    if (!isAuth) {
      const loginUrl = new URL("/login", req.url)

      return NextResponse.redirect(loginUrl)
    }

    /*
     * If the request already starts with /admin,
     * don't rewrite it again.
     *
     * Example:
     * /admin/users -> /admin/users
     */
    if (url.pathname.startsWith("/admin")) {
      return NextResponse.next()
    }

    /*
     * Rewrite:
     *
     * admin.nyenyak.com/
     *        ↓
     * /admin/
     *
     * admin.nyenyak.com/users
     *        ↓
     * /admin/users
     */
    return NextResponse.rewrite(
      new URL(`/admin${url.pathname}`, req.url)
    )
  }

  /*
   * ============================================================
   * ROOT / MARKETING DOMAIN
   * ============================================================
   *
   * nyenyak.com
   * www.nyenyak.com
   */

  if (!subdomain || subdomain === "www") {
    return NextResponse.next()
  }

  /*
   * ============================================================
   * TENANT / BRANCH SUBDOMAIN
   * ============================================================
   *
   * juanda.nyenyak.com
   * medan.nyenyak.com
   * etc.
   */

  // Protect tenant routes
  if (!isAuth) {
    const loginUrl = new URL("/login", req.url)

    return NextResponse.redirect(loginUrl)
  }

  /*
   * Rewrite tenant requests:
   *
   * juanda.nyenyak.com/
   *        ↓
   * /juanda/
   *
   * juanda.nyenyak.com/pos
   *        ↓
   * /juanda/pos
   *
   * juanda.nyenyak.com/orders
   *        ↓
   * /juanda/orders
   */
  return NextResponse.rewrite(
    new URL(`/${subdomain}${url.pathname}`, req.url)
  )
})