import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production');

const publicRoutes = [
  '/landing', '/login', '/register',
  '/api/auth/login', '/api/auth/register', '/api/auth/otp',
  '/api/auth/send-otp', '/api/auth/verify-otp',
  '/api/auth/me', '/api/auth/logout', '/api/auth/session',
  '/api/get-medicines',
];

// Routes each role can access. /api/ai and /api/auth are shared across all authenticated roles.
const roleMap: Record<string, string[]> = {
  ADMIN:      ['/admin', '/pharmacy', '/patient', '/doctor', '/staff', '/chat', '/consult', '/api/webrtc', '/api/admin', '/api/ai', '/api/auth', '/api/appointments', '/api/doctors', '/api/medicines', '/api/orders', '/api/inventory', '/api/prescriptions', '/api/queue', '/api/patient', '/api/categories', '/api/subscriptions', '/api/pharmacy'],
  PHARMACIST: ['/pharmacy', '/chat', '/api/ai', '/api/auth', '/api/medicines', '/api/orders', '/api/inventory', '/api/prescriptions', '/api/patient', '/api/categories', '/api/subscriptions', '/api/pharmacy'],
  PATIENT:    ['/patient', '/chat', '/consult', '/api/webrtc', '/api/ai', '/api/auth', '/api/patient', '/api/appointments', '/api/medicines', '/api/orders', '/api/prescriptions', '/api/doctors', '/api/queue', '/api/categories', '/api/subscriptions'],
  DOCTOR:     ['/doctor', '/chat', '/consult', '/api/webrtc', '/api/ai', '/api/auth', '/api/patient', '/api/appointments', '/api/prescriptions', '/api/doctors', '/api/categories'],
  STAFF:      ['/pharmacy', '/api/ai', '/api/auth'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 2. Get token from cookies
  const token = request.cookies.get('token')?.value;

  // 3. If no token, redirect to landing
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  try {
    // 4. Verify token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = payload.role as string;

    // 5. Check if user has access to this route
    const allowedPaths = roleMap[role as keyof typeof roleMap] || [];
    const isAllowed = allowedPaths.some(allowed => pathname.startsWith(allowed) || pathname.startsWith(`/api${allowed}`));

    // 6. Special case: /dashboard is just a redirect
    if (pathname === '/dashboard') {
      const dashboardPath = roleMap[role as keyof typeof roleMap]?.[0] || '/patient';
      return NextResponse.redirect(new URL(`${dashboardPath}/dashboard`, request.url));
    }

    if (!isAllowed) {
      console.warn(`Access denied: ${role} tried to access ${pathname}`);
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Redirect to their highest privileged dashboard
      const dashboardPath = roleMap[role as keyof typeof roleMap]?.[0] || '/patient';
      return NextResponse.redirect(new URL(`${dashboardPath}/dashboard`, request.url));
    }

    // 7. If accessing login/landing while logged in, redirect to dashboard
    if (pathname === '/login' || pathname === '/landing' || pathname === '/') {
      const dashboardPath = roleMap[role as keyof typeof roleMap]?.[0] || '/patient';
      return NextResponse.redirect(new URL(`${dashboardPath}/dashboard`, request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, clear it and redirect to login
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      response.cookies.delete('token');
      return response;
    }
    const response = NextResponse.redirect(new URL('/landing', request.url));
    response.cookies.delete('token');
    return response;
  }
}

// Specify which routes the middleware runs on
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
