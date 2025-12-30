import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, checkUserOwnsCard, getUserById } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// POST: Create a new trade offer
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, senderCardIds, receiverCardIds } = body;

    // Validate input
    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    if (!senderCardIds || !Array.isArray(senderCardIds) || senderCardIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one sender card is required' },
        { status: 400 }
      );
    }

    if (!receiverCardIds || !Array.isArray(receiverCardIds) || receiverCardIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one receiver card is required' },
        { status: 400 }
      );
    }

    // Check sender is not receiver
    if (receiverId === authUser.userId) {
      return NextResponse.json(
        { error: 'Cannot trade with yourself' },
        { status: 400 }
      );
    }

    // Check receiver exists
    const receiver = await getUserById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Verify sender owns all their cards
    for (const cardId of senderCardIds) {
      const owns = await checkUserOwnsCard(authUser.userId, cardId);
      if (!owns) {
        return NextResponse.json(
          { error: 'You do not own one or more of the selected cards' },
          { status: 400 }
        );
      }
    }

    // Verify receiver owns all their cards
    for (const cardId of receiverCardIds) {
      const owns = await checkUserOwnsCard(receiverId, cardId);
      if (!owns) {
        return NextResponse.json(
          { error: 'Receiver does not own one or more of the selected cards' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseAdminClient();
    const tradeId = uuidv4();

    // Create trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        id: tradeId,
        sender_id: authUser.userId,
        receiver_id: receiverId,
        status: 'pending',
      })
      .select()
      .single();

    if (tradeError) {
      console.error('Error creating trade:', tradeError);
      return NextResponse.json(
        { error: 'Failed to create trade' },
        { status: 500 }
      );
    }

    // Add sender cards to trade
    const senderTradeCards = senderCardIds.map((cardId: string) => ({
      id: uuidv4(),
      trade_id: tradeId,
      card_id: cardId,
      owner_type: 'sender' as const,
    }));

    // Add receiver cards to trade
    const receiverTradeCards = receiverCardIds.map((cardId: string) => ({
      id: uuidv4(),
      trade_id: tradeId,
      card_id: cardId,
      owner_type: 'receiver' as const,
    }));

    const { error: tradeCardsError } = await supabase
      .from('trade_cards')
      .insert([...senderTradeCards, ...receiverTradeCards]);

    if (tradeCardsError) {
      console.error('Error adding trade cards:', tradeCardsError);
      // Rollback trade
      await supabase.from('trades').delete().eq('id', tradeId);
      return NextResponse.json(
        { error: 'Failed to create trade' },
        { status: 500 }
      );
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Create trade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Get all trades for the current user
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

    // Get trades where user is sender or receiver
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
      .or(`sender_id.eq.${authUser.userId},receiver_id.eq.${authUser.userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trades:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trades' },
        { status: 500 }
      );
    }

    // Transform the data to match expected format
    const transformedTrades = trades?.map((trade) => ({
      ...trade,
      sender_cards: trade.trade_cards?.filter((tc: { owner_type: string }) => tc.owner_type === 'sender') || [],
      receiver_cards: trade.trade_cards?.filter((tc: { owner_type: string }) => tc.owner_type === 'receiver') || [],
    }));

    return NextResponse.json(transformedTrades);
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
