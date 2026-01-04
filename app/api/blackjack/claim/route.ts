import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getUserById } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Maximum cards a user can own
const MAX_CARDS_PER_USER = 100;

interface BlackjackCard {
  id: string;
  song_name: string;
  artist_name: string;
  album_art_url: string;
  momentum: number;
}

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

    // Parse request body
    const body = await request.json();
    const { cards } = body as { cards: BlackjackCard[] };

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'Must provide an array of cards to claim' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get user
    const user = await getUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check current card count
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', authUser.userId);

    const currentCardCount = userCards?.length || 0;
    const availableSlots = MAX_CARDS_PER_USER - currentCardCount;

    if (availableSlots <= 0) {
      return NextResponse.json(
        { error: 'Your collection is full (max 100 cards)' },
        { status: 400 }
      );
    }

    // Limit cards to available slots
    const cardsToAdd = cards.slice(0, availableSlots);
    const addedCards: string[] = [];
    let totalMomentumAdded = 0;

    // Add each card to user's collection
    // Each card is a UNIQUE entry - even same songs become different cards
    for (const card of cardsToAdd) {
      // Create a new unique card entry in the cards table
      const newCardId = uuidv4();
      const { data: newCard, error: createError } = await supabase
        .from('cards')
        .insert({
          id: newCardId,
          spotify_track_id: card.id, // card.id is the spotify track id
          song_name: card.song_name,
          artist_name: card.artist_name,
          album_name: '', // Not provided by blackjack deck
          album_art_url: card.album_art_url,
          momentum: card.momentum,
          energy: 0, // Starting energy
          bpm: 120, // Default BPM
          genre: 'blackjack',
          popularity: 50, // Default popularity
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating card:', createError);
        continue;
      }

      // Add to user_cards
      const userCardId = uuidv4();
      const { error: insertError } = await supabase
        .from('user_cards')
        .insert({
          id: userCardId,
          user_id: authUser.userId,
          card_id: newCard.id,
          acquired_via: 'blackjack',
        });

      if (!insertError) {
        addedCards.push(newCard.id);
        totalMomentumAdded += card.momentum;
      }
    }

    // Update user stats if we added any cards
    if (addedCards.length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_momentum: user.total_momentum + totalMomentumAdded,
          cards_collected: user.cards_collected + addedCards.length,
        })
        .eq('id', authUser.userId);

      if (updateError) {
        console.error('Error updating user stats:', updateError);
        // Don't fail - cards were already added
      }
    }

    return NextResponse.json({
      success: true,
      message: `${addedCards.length} card(s) added to your collection`,
      addedCards,
      skipped: cards.length - addedCards.length,
    });
  } catch (error) {
    console.error('Blackjack claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
