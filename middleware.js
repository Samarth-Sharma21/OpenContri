import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession();
    
    // Log session status for debugging
    console.log('Middleware session check:', session ? 'Session exists' : 'No session');
    
    // If session exists, refresh it to keep it active
    if (session) {
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
  }

  return res;
}