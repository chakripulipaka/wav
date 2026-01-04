import { NextRequest, NextResponse } from 'next/server';
import { getUserById, getSupabaseAdminClient, checkUserOwnsCard } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; cardId: string }> }
) {
  try {
    const { userId, cardId } = await params;

    // Verify authentication
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is deleting their own card
    if (authUser.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only remove cards from your own collection' },
        { status: 403 }
      );
    }

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user owns the card
    const ownsCard = await checkUserOwnsCard(userId, cardId);
    if (!ownsCard) {
      return NextResponse.json(
        { error: 'You do not own this card' },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get the card details to update user stats
    const { data: cardData } = await supabase
      .from('cards')
      .select('momentum')
      .eq('id', cardId)
      .single();

    const cardMomentum = cardData?.momentum || 0;

    // Delete from user_cards
    const { error: deleteError } = await supabase
      .from('user_cards')
      .delete()
      .eq('user_id', userId)
      .eq('card_id', cardId);

    if (deleteError) {
      console.error('Error deleting card from collection:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove card from collection' },
        { status: 500 }
      );
    }

    // Update user stats
    const newCardsCollected = Math.max(0, user.cards_collected - 1);
    const newTotalMomentum = Math.max(0, user.total_momentum - cardMomentum);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        cards_collected: newCardsCollected,
        total_momentum: newTotalMomentum,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      // Don't fail the request, card was already removed
    }

    return NextResponse.json({
      success: true,
      message: 'Card removed from collection',
      cardId,
    });
  } catch (error) {
    console.error('Delete card error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
