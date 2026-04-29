import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas que requieren protección
  const protectedPaths = ['/dashboard', '/inventory', '/sales'];
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));

  // 1. Si no hay token y es ruta protegida -> al Login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Si hay token e intenta ir al Login -> al Dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// El matcher debe ser exacto
export const config = {
  matcher: ['/dashboard/:path*', '/inventory/:path*', '/sales/:path*', '/login'],
};