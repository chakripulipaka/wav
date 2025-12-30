import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
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
      .select('*')
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
        { error: 'Only the receiver can decline this trade' },
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

    // Update trade status
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('id', tradeId)
      .select()
      .single();

    if (updateError) {
      console.error('Error declining trade:', updateError);
      return NextResponse.json(
        { error: 'Failed to decline trade' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...updatedTrade,
      message: 'Trade declined',
    });
  } catch (error) {
    console.error('Decline trade error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
