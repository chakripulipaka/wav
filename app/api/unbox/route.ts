import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient, getUserById, getCardBySpotifyId } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  getRandomTrackForGenre,
  calculateCardStats,
  getBestAlbumArt,
  getTrackDetails,
  getAudioFeatures,
  AVAILABLE_GENRES,
} from '@/lib/spotify';
import { v4 as uuidv4 } from 'uuid';

// Cooldown period in milliseconds (30 seconds)
const UNBOX_COOLDOWN_MS = 30 * 1000;

// Maximum cards a user can own
const MAX_CARDS_PER_USER = 100;

// Wheel track info passed from frontend
interface WheelTrackInfo {
  spotifyTrackId: string;
  songName: string;
  artistName: string;
  albumArtUrl: string;
  momentum: number;
  bpm: number;
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
    const { category, wheelTrack } = body as { category?: string; wheelTrack?: WheelTrackInfo };

    // Validate - must have either category (old flow) or wheelTrack (new wheel flow)
    const isWheelFlow = !!wheelTrack;
    const isCategoryFlow = !!category;

    if (!isWheelFlow && !isCategoryFlow) {
      return NextResponse.json(
        { error: 'Must provide either category or wheelTrack' },
        { status: 400 }
      );
    }

    if (isCategoryFlow && !AVAILABLE_GENRES.includes(category!.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid category. Available genres: ${AVAILABLE_GENRES.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Get user and check cooldown
    const user = await getUserById(authUser.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check cooldown
    if (user.last_unbox_time) {
      const lastUnbox = new Date(user.last_unbox_time).getTime();
      const now = Date.now();
      const timeSinceLastUnbox = now - lastUnbox;

      if (timeSinceLastUnbox < UNBOX_COOLDOWN_MS) {
        const remainingMs = UNBOX_COOLDOWN_MS - timeSinceLastUnbox;
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${remainingSeconds} second(s) before unboxing again`,
            nextUnboxTime: new Date(lastUnbox + UNBOX_COOLDOWN_MS).toISOString(),
          },
          { status: 429 }
        );
      }
    }

    // Check if user has reached max cards
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('id')
      .eq('user_id', authUser.userId);

    if (userCards && userCards.length >= MAX_CARDS_PER_USER) {
      return NextResponse.json(
        { error: `You've reached the maximum of ${MAX_CARDS_PER_USER} cards. Trade or delete some cards to unbox more.` },
        { status: 400 }
      );
    }

    let card;
    let isNewCard = false;
    let cardGenre = 'mixed';

    if (isWheelFlow) {
      // WHEEL FLOW: Use the track info passed from frontend
      const { spotifyTrackId, songName, artistName, albumArtUrl, momentum, bpm } = wheelTrack!;

      // Check if card already exists in database
      card = await getCardBySpotifyId(spotifyTrackId);

      if (!card) {
        // Get track details from Spotify to fill in any missing info
        const track = await getTrackDetails(spotifyTrackId);
        const albumName = track?.album?.name || 'Unknown Album';
        const previewUrl = track?.preview_url || null;
        const popularity = track?.popularity || 50;

        // Create new card in database
        // Energy starts at 0, momentum is from wheel data
        const cardId = uuidv4();
        const { data: newCard, error: cardError } = await supabase
          .from('cards')
          .insert({
            id: cardId,
            spotify_track_id: spotifyTrackId,
            song_name: songName,
            artist_name: artistName,
            album_name: albumName,
            album_art_url: albumArtUrl,
            preview_url: previewUrl,
            energy: 0, // Cards start at 0 energy
            momentum: momentum,
            bpm: bpm,
            genre: cardGenre,
            popularity: popularity,
          })
          .select()
          .single();

        if (cardError) {
          console.error('Error creating card:', cardError);
          return NextResponse.json(
            { error: 'Failed to create card' },
            { status: 500 }
          );
        }

        card = newCard;
        isNewCard = true;
      }
    } else {
      // CATEGORY FLOW: Get random track from Spotify (legacy)
      const trackResult = await getRandomTrackForGenre(category!.toLowerCase());
      if (!trackResult) {
        return NextResponse.json(
          { error: 'Failed to find a track. Please try again.' },
          { status: 500 }
        );
      }

      const { track, audioFeatures } = trackResult;
      cardGenre = category!.toLowerCase();

      // Check if card already exists in database
      card = await getCardBySpotifyId(track.id);

      if (!card) {
        // Calculate card stats
        const stats = calculateCardStats(track, audioFeatures);

        // Create new card in database
        const cardId = uuidv4();
        const { data: newCard, error: cardError } = await supabase
          .from('cards')
          .insert({
            id: cardId,
            spotify_track_id: track.id,
            song_name: track.name,
            artist_name: track.artists.map((a) => a.name).join(', '),
            album_name: track.album.name,
            album_art_url: getBestAlbumArt(track),
            preview_url: track.preview_url,
            energy: 0, // Cards start at 0 energy
            momentum: stats.momentum,
            bpm: stats.bpm,
            genre: cardGenre,
            popularity: track.popularity,
          })
          .select()
          .single();

        if (cardError) {
          console.error('Error creating card:', cardError);
          return NextResponse.json(
            { error: 'Failed to create card' },
            { status: 500 }
          );
        }

        card = newCard;
        isNewCard = true;
      }
    }

    // Add card to user's collection
    const userCardId = uuidv4();
    const { error: userCardError } = await supabase
      .from('user_cards')
      .insert({
        id: userCardId,
        user_id: authUser.userId,
        card_id: card.id,
        acquired_via: 'unbox',
      });

    if (userCardError) {
      console.error('Error adding card to collection:', userCardError);
      return NextResponse.json(
        { error: 'Failed to add card to collection' },
        { status: 500 }
      );
    }

    // Update user stats and last_unbox_time
    // Note: We don't add card.energy to total_energy since cards start at 0
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        last_unbox_time: new Date().toISOString(),
        total_momentum: user.total_momentum + card.momentum,
        cards_collected: user.cards_collected + 1,
      })
      .eq('id', authUser.userId);

    if (updateError) {
      console.error('Error updating user stats:', updateError);
      // Don't fail the request, card was already added
    }

    // Create unboxing record
    const { error: unboxingError } = await supabase
      .from('unboxings')
      .insert({
        id: uuidv4(),
        user_id: authUser.userId,
        card_id: card.id,
        category: cardGenre,
      });

    if (unboxingError) {
      console.error('Error creating unboxing record:', unboxingError);
      // Don't fail the request, card was already added
    }

    return NextResponse.json({
      card,
      isNew: isNewCard,
      message: isNewCard
        ? 'Congratulations! You discovered a new card!'
        : 'You got this card!',
    });
  } catch (error) {
    console.error('Unbox error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
