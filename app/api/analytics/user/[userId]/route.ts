import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getUserById, getUserCards, ensureTodayStats } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import { calculateEnergy, type UserAnalytics, type Trade } from '@/lib/types';

// Type for the trade query result
interface TradeQueryResult {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  sender: { id: string; username: string; avatar_url?: string } | null;
  receiver: { id: string; username: string; avatar_url?: string } | null;
  trade_cards: Array<{
    id: string;
    card_id: string;
    owner_type: string;
    card: Record<string, unknown>;
  }> | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Get authenticated user (for privacy checks)
    const authUser = await getAuthenticatedUser();
    const isOwner = authUser?.userId === userId;

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure today's stats are stored (lazy update)
    await ensureTodayStats(userId);

    // Get user's cards
    const userCards = await getUserCards(userId);

    // Calculate analytics with dynamic energy calculation
    let totalEnergy = 0;
    let totalMomentum = 0;
    let totalBpm = 0;
    const genreCount: Record<string, number> = {};

    for (const uc of userCards) {
      if (uc.card) {
        // Calculate energy dynamically based on momentum and time since card creation
        totalEnergy += calculateEnergy(uc.card.momentum, uc.card.created_at);
        totalMomentum += uc.card.momentum;
        totalBpm += uc.card.bpm;

        const genre = uc.card.genre || 'unknown';
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      }
    }

    const totalCards = userCards.length;
    const avgBpm = totalCards > 0 ? Math.round(totalBpm / totalCards) : 0;

    // Convert genre distribution to array
    const genreDistribution = Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);

    // Get recent trades (only if public or owner)
    let recentTrades: UserAnalytics['recentTrades'] = [];

    if (user.trade_privacy === 'public' || isOwner) {
      const supabase = getSupabaseAdminClient();
      const { data: trades } = await supabase
        .from('trades')
        .select(`
          *,
          sender:profiles!trades_sender_id_fkey(id, username, avatar_url),
          receiver:profiles!trades_receiver_id_fkey(id, username, avatar_url),
          trade_cards(
            id,
            card_id,
            owner_type,
            card:cards(*)
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(5);

      // Transform trades data
      const typedTrades = (trades || []) as unknown as TradeQueryResult[];
      recentTrades = typedTrades.map((trade) => ({
        ...trade,
        sender_cards: (trade.trade_cards || []).filter((tc) => tc.owner_type === 'sender'),
        receiver_cards: (trade.trade_cards || []).filter((tc) => tc.owner_type === 'receiver'),
      })) as unknown as Trade[];
    }

    const analytics: UserAnalytics = {
      totalCards,
      totalEnergy,
      totalMomentum,
      avgBpm,
      genreDistribution,
      recentTrades,
      deckPrivacy: user.deck_privacy,
      tradePrivacy: user.trade_privacy,
      isOwner,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
