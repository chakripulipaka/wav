import { NextResponse } from 'next/server';
import { getUserById } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

// Cooldown period in milliseconds (30 seconds)
const UNBOX_COOLDOWN_MS = 30 * 1000;

export async function GET() {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await getUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check cooldown
    if (!user.last_unbox_time) {
      return NextResponse.json({
        canUnbox: true,
      });
    }

    const lastUnbox = new Date(user.last_unbox_time).getTime();
    const now = Date.now();
    const timeSinceLastUnbox = now - lastUnbox;

    if (timeSinceLastUnbox >= UNBOX_COOLDOWN_MS) {
      return NextResponse.json({
        canUnbox: true,
      });
    }

    const nextUnboxTime = new Date(lastUnbox + UNBOX_COOLDOWN_MS).toISOString();

    return NextResponse.json({
      canUnbox: false,
      nextUnboxTime,
      remainingMs: UNBOX_COOLDOWN_MS - timeSinceLastUnbox,
    });
  } catch (error) {
    console.error('Cooldown check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
