import { NextRequest, NextResponse } from 'next/server';
import { getUserCards, getUserById, getSupabaseAdminClient } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import { calculateEnergy } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check privacy settings (allow if public or if requesting own cards)
    const authUser = await getAuthenticatedUser();
    const isOwner = authUser?.userId === userId;

    if (user.deck_privacy === 'private') {
      if (!authUser || !isOwner) {
        return NextResponse.json(
          { error: 'This deck is private' },
          { status: 403 }
        );
      }
    }

    // Get user's cards with full card details
    const userCards = await getUserCards(userId);

    // Calculate total energy from all cards (on-demand calculation)
    let totalEnergy = 0;
    for (const uc of userCards) {
      if (uc.card) {
        totalEnergy += calculateEnergy(uc.card.momentum, uc.card.created_at);
      }
    }

    // If this is the owner viewing their own deck, update their cached total_energy
    if (isOwner) {
      const supabase = getSupabaseAdminClient();
      await supabase
        .from('profiles')
        .update({ total_energy: totalEnergy })
        .eq('id', userId);
    }

    return NextResponse.json(userCards);
  } catch (error) {
    console.error('Get user cards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
