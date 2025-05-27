import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  const isAuthenticated = !!token;
  
  // Paths that require authentication
  const protectedPaths = ['/', '/account'];
  const isProtectedPath = protectedPaths.includes(request.nextUrl.pathname);
  
  // If trying to access a protected route without being logged in
  if (isProtectedPath && !isAuthenticated) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/account']
};