import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/supabase';

export async function GET() {
  try {
    const leaderboard = await getLeaderboard(10);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
