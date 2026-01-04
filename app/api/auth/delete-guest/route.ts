import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST() {
  try {
    // Get the authenticated user
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const adminClient = getSupabaseAdminClient();

    // Get the user's profile to verify they're a guest
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('is_guest')
      .eq('id', authUser.userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Only allow deleting guest accounts
    if (!profile.is_guest) {
      return NextResponse.json(
        { error: 'This endpoint is only for guest accounts' },
        { status: 403 }
      );
    }

    // Delete the profile first (due to foreign key constraints)
    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', authUser.userId);

    if (deleteProfileError) {
      console.error('Failed to delete guest profile:', deleteProfileError);
      return NextResponse.json(
        { error: 'Failed to delete guest account' },
        { status: 500 }
      );
    }

    // Delete the auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      authUser.userId
    );

    if (deleteAuthError) {
      console.error('Failed to delete guest auth user:', deleteAuthError);
      // Profile is already deleted, so just log this error
    }

    // Sign out to clear cookies
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

    await supabase.auth.signOut();

    return NextResponse.json({
      message: 'Guest account deleted successfully',
    });
  } catch (error) {
    console.error('Delete guest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
