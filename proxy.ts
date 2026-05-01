import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for Edge Runtime
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export default function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100 // 100 requests per minute for artists

  // Clean up old entries (simple)
  if (rateLimitMap.size > 1000) rateLimitMap.clear()

  const limitData = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs }

  if (now > limitData.resetTime) {
    limitData.count = 1
    limitData.resetTime = now + windowMs
  } else {
    limitData.count++
  }

  rateLimitMap.set(ip, limitData)

  const response = NextResponse.next()

  // --- Add Security Headers ---
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // --- Check Rate Limit ---
  if (limitData.count > maxRequests && request.nextUrl.pathname.startsWith('/api')) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please slow down.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
