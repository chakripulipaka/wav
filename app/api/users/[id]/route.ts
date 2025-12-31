import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUserProfile } from '@/lib/supabase';
import { getAuthenticatedUser, sanitizeUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return sanitized user data
    return NextResponse.json(sanitizeUser(user));
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Verify authentication
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Users can only update their own profile
    if (authUser.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { deck_privacy, trade_privacy } = body;

    // Validate privacy values
    const validPrivacy = ['public', 'private'];
    if (deck_privacy && !validPrivacy.includes(deck_privacy)) {
      return NextResponse.json(
        { error: 'Invalid deck_privacy value' },
        { status: 400 }
      );
    }
    if (trade_privacy && !validPrivacy.includes(trade_privacy)) {
      return NextResponse.json(
        { error: 'Invalid trade_privacy value' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: { deck_privacy?: 'public' | 'private'; trade_privacy?: 'public' | 'private' } = {};
    if (deck_privacy) updates.deck_privacy = deck_privacy;
    if (trade_privacy) updates.trade_privacy = trade_privacy;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUserProfile(userId, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: sanitizeUser(updatedUser) });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
