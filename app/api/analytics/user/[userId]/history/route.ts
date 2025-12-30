import { NextRequest, NextResponse } from 'next/server';
import { getUserById, ensureTodayStats, getDailyStats } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import type { HistoricalDataPoint } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const timeScale = searchParams.get('timeScale') || 'week';

    // Get authenticated user (for privacy checks)
    const authUser = await getAuthenticatedUser();
    const isOwner = authUser?.userId === userId;

    // Get user and check privacy
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Analytics data is based on cards, so check deck privacy
    if (user.deck_privacy === 'private' && !isOwner) {
      return NextResponse.json(
        { error: 'This user\'s analytics are private' },
        { status: 403 }
      );
    }

    // Ensure today's stats are stored (lazy update)
    await ensureTodayStats(userId);

    // Determine how many days to fetch
    let days: number;
    if (timeScale === 'day') {
      days = 1;
    } else if (timeScale === 'week') {
      days = 7;
    } else {
      days = 30; // month
    }

    // Fetch stats from the database
    const dailyStats = await getDailyStats(userId, days);

    // Transform to HistoricalDataPoint format
    const historicalData: HistoricalDataPoint[] = dailyStats.map((stat) => ({
      date: stat.date,
      energy: stat.energy,
      momentum: stat.momentum,
    }));

    return NextResponse.json({
      data: historicalData,
      timeScale,
    });
  } catch (error) {
    console.error('Get analytics history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
