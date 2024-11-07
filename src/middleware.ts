import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EmbeddedWallet } from '@/utils/EmbeddedWallet'

const SECURE_TOKEN = process.env.NEXT_PUBLIC_HELIUS_WEBHOOK_TOKEN;

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Only process requests to /api/*
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Custom logic for API requests
    console.log('Processing API request:', request.nextUrl.pathname);

    // Check for secure token in /api/v1/helius routes
    if (request.nextUrl.pathname.startsWith('/api/v1/helius')) {
      const authHeader = request.headers.get('authorization');
      console.log('authHeader', authHeader);
      if (!authHeader || authHeader !== `Bearer ${SECURE_TOKEN}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};