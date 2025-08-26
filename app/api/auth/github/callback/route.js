import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  
  // Verify state parameter to prevent CSRF attacks
  const storedState = request.cookies.get('github-oauth-state')?.value;
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', process.env.NEXT_PUBLIC_BASE_URL));
  }
  
  if (!state || state !== storedState) {
    console.error('State verification failed', { state, storedState });
    return NextResponse.redirect(new URL('/?error=invalid_state', process.env.NEXT_PUBLIC_BASE_URL));
  }

  // Create a Supabase client with the service role key for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Exchange GitHub code for an access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/github/callback`
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Error getting GitHub access token:', tokenData.error);
      return NextResponse.redirect(new URL(`/?error=${tokenData.error}`, process.env.NEXT_PUBLIC_BASE_URL));
    }
    
    // Get GitHub user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const userData = await userResponse.json();
    
    // Get user email (might be private)
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const emails = await emailResponse.json();
    const primaryEmail = emails.find(email => email.primary)?.email || emails[0]?.email;
    
    if (!primaryEmail) {
      console.error('No email found for GitHub user');
      return NextResponse.redirect(new URL('/?error=no_email', process.env.NEXT_PUBLIC_BASE_URL));
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(primaryEmail);
    
    // Sign in or sign up the user with Supabase
    // Instead of using signInWithOAuth which requires a redirect,
    // we'll use admin signUp to create the session directly
    const { data, error } = existingUser ? 
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: {
          full_name: userData.name,
          avatar_url: userData.avatar_url,
          provider: 'github',
          provider_id: userData.id.toString(),
          preferred_username: userData.login
        }
      }) : 
      await supabaseAdmin.auth.admin.createUser({
      email: primaryEmail,
      email_confirm: true,
      user_metadata: {
        full_name: userData.name,
        avatar_url: userData.avatar_url,
        provider: 'github',
        provider_id: userData.id.toString(),
        preferred_username: userData.login
      }
    });

    if (error) {
      console.error('Error signing in with Supabase:', error);
      return NextResponse.redirect(new URL(`/?error=${error.message}`, process.env.NEXT_PUBLIC_BASE_URL));
    }
    
    // Store additional user data in profiles table
    const userId = data?.user?.id;
    
    if (!userId) {
      console.error('No user ID found after creating user');
      return NextResponse.redirect(new URL('/?error=auth_error', process.env.NEXT_PUBLIC_BASE_URL));
    }
    
    // Session will be created later
    
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing profile:', profileError);
    }
    
    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          username: userData.login,
          full_name: userData.name,
          avatar_url: userData.avatar_url,
          email: primaryEmail,
          github_id: userData.id.toString(),
          github_url: userData.html_url,
          updated_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId,
      refresh_token: crypto.randomUUID(), // Generate a unique refresh token
      expires_in: 60 * 60 * 24 * 7 // 1 week
    });
     
     if (sessionError) {
        console.error('Error creating session:', sessionError);
        return NextResponse.redirect(new URL('/?error=session_error', process.env.NEXT_PUBLIC_BASE_URL));
      }
     
     console.log('Session created successfully:', !!sessionData?.session);
     
     // Create response with redirect
     const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL));
     
     // Set auth cookies
     if (sessionData?.session) {
       const { access_token, refresh_token } = sessionData.session;
       
       // Set the access token cookie
       response.cookies.set('sb-access-token', access_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         maxAge: 60 * 60 * 24 * 7, // 1 week
         path: '/'
       });
       
       // Set the refresh token cookie
       response.cookies.set('sb-refresh-token', refresh_token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         maxAge: 60 * 60 * 24 * 7, // 1 week
         path: '/'
       });
       
       // Also set the session cookie that Supabase auth-helpers expects
       response.cookies.set('supabase-auth-token', JSON.stringify([access_token, refresh_token]), {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         maxAge: 60 * 60 * 24 * 7, // 1 week
         path: '/'
       });
     }
    
    // Clear the state cookie
    response.cookies.set('github-oauth-state', '', {
      expires: new Date(0),
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    return NextResponse.redirect(new URL('/?error=server_error', process.env.NEXT_PUBLIC_BASE_URL));
  }
}