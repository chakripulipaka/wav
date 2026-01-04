import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getUserPreferences } from '@/lib/supabase';
import {
  getRandomTracksForWheel,
  getTracksWithPreferences,
  calculateCardStats,
  getBestAlbumArt,
} from '@/lib/spotify';

export async function GET() {
  try {
    // Verify authentication
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user preferences
    const preferences = await getUserPreferences(authUser.userId);
    const hasPreferences =
      preferences &&
      (preferences.top_genres.length > 0 || preferences.top_artists.length > 0);

    // Fetch 20 tracks - with preferences if available, otherwise random
    let trackResults;
    if (hasPreferences) {
      const preferredArtists = preferences.top_artists.map((a) => ({
        id: a.spotify_id,
        name: a.name,
      }));
      trackResults = await getTracksWithPreferences(
        preferredArtists,
        preferences.top_genres,
        20, // count
        0.8, // 80% from preferred artists
        0.5 // 50% of remaining 20% from preferred genres (10% genre, 10% random)
      );
    } else {
      trackResults = await getRandomTracksForWheel(20);
    }

    if (trackResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch random tracks' },
        { status: 500 }
      );
    }

    // Transform to BlackjackGameCard format
    const deck = trackResults.map(({ track, audioFeatures }) => {
      const stats = calculateCardStats(track, audioFeatures);
      return {
        id: track.id, // spotify track id
        song_name: track.name,
        artist_name: track.artists.map((a) => a.name).join(', '),
        album_art_url: getBestAlbumArt(track),
        momentum: stats.momentum,
      };
    });

    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Blackjack deck error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
