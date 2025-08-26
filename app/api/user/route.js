import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get user profile data
export async function GET(request) {
  try {
    // Get the session from the request
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user data from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in user GET route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update user profile data
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, userData } = body;

    if (!userId || !userData) {
      return NextResponse.json({ error: 'User ID and user data are required' }, { status: 400 });
    }

    // Update user data in Supabase
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(userData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user data:', error);
      return NextResponse.json({ error: 'Failed to update user data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in user POST route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}