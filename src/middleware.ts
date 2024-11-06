import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { EmbeddedWallet } from '@/utils/EmbeddedWallet'
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    // Only process requests to /api/*
    if (request.nextUrl.pathname.startsWith('/api')) {
      // Custom logic for API requests
      console.log('Processing API request:', request.nextUrl.pathname);
    }

    return NextResponse.next();
  }
  
export const config = {
    matcher: ['/api/:path*'],
  };