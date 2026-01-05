import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabase';

// Generate a random secure password for guest accounts
function generateRandomPassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST() {
  try {
    const adminClient = getSupabaseAdminClient();

    // Get the next guest number (transaction-safe approach)
    const { data: maxGuestData } = await adminClient
      .from('profiles')
      .select('guest_number')
      .eq('is_guest', true)
      .order('guest_number', { ascending: false })
      .limit(1);

    const nextGuestNumber = maxGuestData && maxGuestData.length > 0
      ? (maxGuestData[0].guest_number || 0) + 1
      : 1;

    const username = `Guest ${nextGuestNumber}`;
    const email = `guest${nextGuestNumber}@wav.internal`;
    const password = generateRandomPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        is_guest: true,
        guest_number: nextGuestNumber,
      },
    });

    if (authError || !authData.user) {
      console.error('Guest auth creation error:', authError);
      return NextResponse.json(
        { error: 'Failed to create guest account' },
        { status: 500 }
      );
    }

    // Create profile in database using admin client
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        username,
        email,
        password_hash: '', // Managed by Supabase Auth
        total_energy: 0,
        total_momentum: 0,
        cards_collected: 0,
        trades_completed: 0,
        deck_privacy: 'public',
        trade_privacy: 'public',
        top_genres: [],
        top_artists: [],
        is_guest: true,
        guest_number: nextGuestNumber,
        preferences_set: false, // Show welcome screen on first login
      });

    if (profileError) {
      console.error('Guest profile creation error:', profileError);

      // Rollback: Delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: 'Failed to create guest profile' },
        { status: 500 }
      );
    }

    // Create SSR client for auto-login (sets session cookies)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Sign in the guest user automatically
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.user) {
      console.error('Guest sign-in error:', signInError);
      return NextResponse.json(
        { error: 'Failed to sign in guest' },
        { status: 500 }
      );
    }

    // Fetch the created profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { password_hash, ...sanitizedProfile } = profile;

    return NextResponse.json({
      user: sanitizedProfile,
      message: `Welcome, ${username}!`,
    });
  } catch (error) {
    console.error('Guest registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
