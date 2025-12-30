import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import type { Card } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const supabase = getSupabaseAdminClient();

    // Get cards with owner counts by counting user_cards entries
    // First get all user_cards grouped by card_id
    const { data: userCardsData, error: userCardsError } = await supabase
      .from('user_cards')
      .select('card_id');

    if (userCardsError) {
      console.error('Error fetching user cards:', userCardsError);
      return NextResponse.json(
        { error: 'Failed to fetch top cards' },
        { status: 500 }
      );
    }

    // Count occurrences of each card_id
    const cardCounts: Record<string, number> = {};
    const userCards = userCardsData as { card_id: string }[] | null;
    (userCards || []).forEach((uc) => {
      cardCounts[uc.card_id] = (cardCounts[uc.card_id] || 0) + 1;
    });

    // Sort by count and take top N
    const topCardIds = Object.entries(cardCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([cardId]) => cardId);

    if (topCardIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch card details for top cards
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .in('id', topCardIds);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return NextResponse.json(
        { error: 'Failed to fetch card details' },
        { status: 500 }
      );
    }

    // Combine cards with their owner counts and sort by count
    const cardsList = cards as Card[] | null;
    const cardsWithCounts = (cardsList || []).map((card) => ({
      ...card,
      num_owned: cardCounts[card.id] || 0,
    }));

    // Sort by num_owned descending
    cardsWithCounts.sort((a, b) => b.num_owned - a.num_owned);

    return NextResponse.json(cardsWithCounts);
  } catch (error) {
    console.error('Get top cards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
