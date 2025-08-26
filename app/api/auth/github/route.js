import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/github/callback`;
  
  // Generate a random state parameter to prevent CSRF attacks
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store the state in a cookie to verify it later
  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`
  );
  
  response.cookies.set('github-oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  });
  
  return response;
}