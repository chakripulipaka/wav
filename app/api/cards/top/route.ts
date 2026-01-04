import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import type { Card } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const supabase = getSupabaseAdminClient();

    // Get top cards by momentum (highest momentum first)
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .order('momentum', { ascending: false })
      .limit(limit);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return NextResponse.json(
        { error: 'Failed to fetch top cards' },
        { status: 500 }
      );
    }

    // Get owner counts for these cards
    const cardIds = (cards || []).map((c: Card) => c.id);

    if (cardIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: userCardsData, error: userCardsError } = await supabase
      .from('user_cards')
      .select('card_id')
      .in('card_id', cardIds);

    if (userCardsError) {
      console.error('Error fetching user cards:', userCardsError);
      // Continue without owner counts
    }

    // Count occurrences of each card_id
    const cardCounts: Record<string, number> = {};
    const userCards = userCardsData as { card_id: string }[] | null;
    (userCards || []).forEach((uc) => {
      cardCounts[uc.card_id] = (cardCounts[uc.card_id] || 0) + 1;
    });

    // Combine cards with their owner counts (already sorted by momentum from DB)
    const cardsList = cards as Card[] | null;
    const cardsWithCounts = (cardsList || []).map((card) => ({
      ...card,
      num_owned: cardCounts[card.id] || 0,
    }));

    return NextResponse.json(cardsWithCounts);
  } catch (error) {
    console.error('Get top cards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
