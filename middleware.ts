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
  // Cloudflare (and other proxies) preserve the original public hostname
  // in the `x-forwarded-host` header while overwriting `host` with the
  // origin server address.  Prefer `x-forwarded-host` when it is present
  // so subdomain detection works correctly behind Cloudflare.
  const hostname =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    ""

  // Build a reliable base URL from the *actual* request host.
  // req.nextUrl may be normalized to AUTH_URL by NextAuth, so we
  // cannot trust req.nextUrl.host for constructing rewrite/redirect URLs.
  const protocol = req.headers.get("x-forwarded-proto") || "https"
  const baseUrl = `${protocol}://${hostname}`

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
      if (subdomain === "admin") {
        return NextResponse.redirect(new URL("/", baseUrl))
      } else if (subdomain && subdomain !== "www") {
        return NextResponse.redirect(new URL("/pos", baseUrl))
      } else {
        return NextResponse.redirect(new URL("/", baseUrl))
      }
    }

    /*
     * There is no root app/login/page.tsx.
     * Login pages live under app/[tenant]/login and app/admin/login.
     * Rewrite /login → /{subdomain}/login so Next.js file-system router
     * finds the correct page.
     * Use req.nextUrl.clone() so the rewrite is always same-origin.
     */
    if (subdomain && subdomain !== "www") {
      const loginRewrite = req.nextUrl.clone()
      loginRewrite.pathname =
        subdomain === "admin" ? "/admin/login" : `/${subdomain}/login`
      return NextResponse.rewrite(loginRewrite)
    }

    // Root domain has no login page — send to marketing home
    return NextResponse.redirect(new URL("/", baseUrl))
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
      return NextResponse.redirect(new URL("/login", baseUrl))
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
    const adminRewrite = req.nextUrl.clone()
    adminRewrite.pathname = `/admin${url.pathname}`
    return NextResponse.rewrite(adminRewrite)
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
    return NextResponse.redirect(new URL("/login", baseUrl))
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
  const tenantRewrite = req.nextUrl.clone()
  tenantRewrite.pathname = `/${subdomain}${url.pathname}`
  return NextResponse.rewrite(tenantRewrite)
})