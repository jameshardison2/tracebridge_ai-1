import { NextRequest, NextResponse } from 'next/server';

/**
 * Optional site-wide Basic Auth gate for the deployed site.
 *
 * Set SITE_BASIC_AUTH_USER and SITE_BASIC_AUTH_PASS in Vercel to turn it on.
 * When they are unset (local dev, student machines), the gate is off.
 *
 * API routes are excluded: they authenticate with Firebase Bearer tokens, and a
 * Basic Auth check here would reject or crash on those Authorization headers.
 */
export function middleware(req: NextRequest) {
  const expectedUser = process.env.SITE_BASIC_AUTH_USER;
  const expectedPass = process.env.SITE_BASIC_AUTH_PASS;
  if (!expectedUser || !expectedPass) return NextResponse.next();

  const header = req.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice('Basic '.length));
      const sep = decoded.indexOf(':');
      if (sep > -1 && decoded.slice(0, sep) === expectedUser && decoded.slice(sep + 1) === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // Malformed header: fall through to the challenge.
    }
  }

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="TraceBridge"' },
  });
}

export const config = {
  // Gate dropped for BU meeting - matcher narrowed to nothing
  matcher: [],
};
