import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. admin.nyenyak.com, juanda.nyenyak.com, localhost:3000)
  const hostname = req.headers.get('host') || 'nyenyak.com';

  // Extract the subdomain
  // In production it will be something like `juanda.nyenyak.com` or `admin.nyenyak.com`
  // In local development it might be `juanda.localhost:3000` or `admin.localhost:3000`
  const currentHost = hostname
    .replace(`.nyenyak.com`, '')
    .replace(`.localhost:3000`, '');

  // Exclude static files and API routes from rewriting
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.startsWith('/sw.js') ||
    url.pathname.startsWith('/manifest')
  ) {
    return NextResponse.next();
  }

  // If the subdomain is 'admin', route to /admin
  if (currentHost === 'admin') {
    // We only rewrite if the pathname doesn't already start with /admin
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = `/admin${url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (
    currentHost !== 'nyenyak.com' &&
    currentHost !== 'www' &&
    currentHost !== 'localhost:3000' &&
    currentHost !== 'localhost' &&
    currentHost !== '192.168.1.76:3000' &&
    currentHost !== '192.168.1.76'
  ) {
    // We rewrite to /[tenant]/pathname
    url.pathname = `/${currentHost}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico, sitemap.xml, robots.txt (metadata files)
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
