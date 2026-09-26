import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization');
  const url = req.nextUrl;

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    // Currently hardcoded so only you can enter. 
    // Username: admin
    // Password: tracebridge2026
    if (user === 'admin' && pwd === 'tracebridge2026') {
      return NextResponse.next();
    }
  }

  url.pathname = '/api/auth';

  return new NextResponse('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}

// See "Matching Paths" below to learn more
export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
