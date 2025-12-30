import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If trying to access admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to admin login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for admin token in cookies or headers
    const token = request.cookies.get('adminToken')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      // Redirect to admin login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Verify token format (basic validation)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [userId, role, timestamp] = decoded.split(':')
      
      if (!userId || !role || !timestamp) {
        throw new Error('Invalid token format')
      }

      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 24 * 60 * 60 * 1000) {
        throw new Error('Token expired')
      }

      // Check if user has admin role
      if (!['ADMIN', 'MODERATOR'].includes(role)) {
        throw new Error('Insufficient permissions')
      }

    } catch (error) {
      // Token is invalid, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('adminToken')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}