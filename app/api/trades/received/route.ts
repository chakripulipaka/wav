import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

// Check if all cards in a trade are still owned by their respective users
async function checkTradeCardOwnership(
  trade: any,
  supabase: ReturnType<typeof getSupabaseAdminClient>
): Promise<boolean> {
  const senderCards = trade.trade_cards?.filter((tc: any) => tc.owner_type === 'sender') || [];
  const receiverCards = trade.trade_cards?.filter((tc: any) => tc.owner_type === 'receiver') || [];

  // Check sender still owns their cards
  for (const tc of senderCards) {
    const { data } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', trade.sender_id)
      .eq('card_id', tc.card_id)
      .single();

    if (!data) return false; // Card no longer owned
  }

  // Check receiver still owns their cards
  for (const tc of receiverCards) {
    const { data } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', trade.receiver_id)
      .eq('card_id', tc.card_id)
      .single();

    if (!data) return false; // Card no longer owned
  }

  return true;
}

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

    const supabase = getSupabaseAdminClient();

    // Get trades received by user
    const { data: trades, error } = await supabase
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
      .eq('receiver_id', authUser.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    // Transform the data and check card ownership for pending trades
    const transformedTrades = await Promise.all(
      (trades || []).map(async (trade) => {
        let status = trade.status;

        // Only check ownership for pending trades
        if (status === 'pending') {
          const cardsStillOwned = await checkTradeCardOwnership(trade, supabase);
          if (!cardsStillOwned) {
            status = 'expired';
          }
        }

        return {
          ...trade,
          status,
          sender_cards: trade.trade_cards?.filter((tc: { owner_type: string }) => tc.owner_type === 'sender') || [],
          receiver_cards: trade.trade_cards?.filter((tc: { owner_type: string }) => tc.owner_type === 'receiver') || [],
        };
      })
    );

    return NextResponse.json(transformedTrades);
  } catch (error) {
    console.error('Get received trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
