import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Временно отключаем проверку auth
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}