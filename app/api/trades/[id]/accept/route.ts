import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, checkUserOwnsCard, getUserById } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tradeId } = await params;

    // Get authenticated user
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get the trade
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_cards(
          id,
          card_id,
          owner_type,
          card:cards(*)
        )
      `)
      .eq('id', tradeId)
      .single();

    if (tradeError || !trade) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    // Check user is the receiver
    if (trade.receiver_id !== authUser.userId) {
      return NextResponse.json(
        { error: 'Only the receiver can accept this trade' },
        { status: 403 }
      );
    }

    // Check trade is pending
    if (trade.status !== 'pending') {
      return NextResponse.json(
        { error: `Trade is already ${trade.status}` },
        { status: 400 }
      );
    }

    // Verify all cards are still owned by their respective owners
    const senderCards = trade.trade_cards.filter((tc: { owner_type: string }) => tc.owner_type === 'sender');
    const receiverCards = trade.trade_cards.filter((tc: { owner_type: string }) => tc.owner_type === 'receiver');

    for (const tc of senderCards) {
      const owns = await checkUserOwnsCard(trade.sender_id, tc.card_id);
      if (!owns) {
        return NextResponse.json(
          { error: 'Sender no longer owns one or more cards in this trade' },
          { status: 400 }
        );
      }
    }

    for (const tc of receiverCards) {
      const owns = await checkUserOwnsCard(trade.receiver_id, tc.card_id);
      if (!owns) {
        return NextResponse.json(
          { error: 'You no longer own one or more cards in this trade' },
          { status: 400 }
        );
      }
    }

    // Perform the card transfers
    // 1. Transfer sender's cards to receiver
    for (const tc of senderCards) {
      const { error: transferError } = await supabase
        .from('user_cards')
        .update({
          user_id: trade.receiver_id,
          acquired_via: 'trade',
        })
        .eq('user_id', trade.sender_id)
        .eq('card_id', tc.card_id);

      if (transferError) {
        console.error('Error transferring sender card:', transferError);
        return NextResponse.json(
          { error: 'Failed to complete trade' },
          { status: 500 }
        );
      }
    }

    // 2. Transfer receiver's cards to sender
    for (const tc of receiverCards) {
      const { error: transferError } = await supabase
        .from('user_cards')
        .update({
          user_id: trade.sender_id,
          acquired_via: 'trade',
        })
        .eq('user_id', trade.receiver_id)
        .eq('card_id', tc.card_id);

      if (transferError) {
        console.error('Error transferring receiver card:', transferError);
        return NextResponse.json(
          { error: 'Failed to complete trade' },
          { status: 500 }
        );
      }
    }

    // Update trade status
    const { error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId);

    if (updateError) {
      console.error('Error updating trade status:', updateError);
    }

    // Update user stats
    const sender = await getUserById(trade.sender_id);
    const receiver = await getUserById(trade.receiver_id);

    // Calculate energy/momentum changes
    let senderEnergyGain = 0;
    let senderMomentumGain = 0;
    let receiverEnergyGain = 0;
    let receiverMomentumGain = 0;

    for (const tc of receiverCards) {
      if (tc.card) {
        senderEnergyGain += tc.card.energy;
        senderMomentumGain += tc.card.momentum;
      }
    }

    for (const tc of senderCards) {
      if (tc.card) {
        receiverEnergyGain += tc.card.energy;
        receiverMomentumGain += tc.card.momentum;
        senderEnergyGain -= tc.card.energy;
        senderMomentumGain -= tc.card.momentum;
      }
    }

    for (const tc of receiverCards) {
      if (tc.card) {
        receiverEnergyGain -= tc.card.energy;
        receiverMomentumGain -= tc.card.momentum;
      }
    }

    // Update sender stats
    if (sender) {
      await supabase
        .from('profiles')
        .update({
          total_energy: Math.max(0, sender.total_energy + senderEnergyGain),
          total_momentum: Math.max(0, sender.total_momentum + senderMomentumGain),
          trades_completed: sender.trades_completed + 1,
        })
        .eq('id', trade.sender_id);
    }

    // Update receiver stats
    if (receiver) {
      await supabase
        .from('profiles')
        .update({
          total_energy: Math.max(0, receiver.total_energy + receiverEnergyGain),
          total_momentum: Math.max(0, receiver.total_momentum + receiverMomentumGain),
          trades_completed: receiver.trades_completed + 1,
        })
        .eq('id', trade.receiver_id);
    }

    return NextResponse.json({
      ...trade,
      status: 'accepted',
      message: 'Trade accepted successfully',
    });
  } catch (error) {
    console.error('Accept trade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
