import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import {
  getRandomTracksForWheel,
  calculateCardStats,
  getBestAlbumArt,
} from '@/lib/spotify';

// Wheel track response type
export interface WheelTrack {
  id: string; // spotify track id
  songName: string;
  artistName: string;
  albumArtUrl: string;
  momentum: number;
  energy: number;
  bpm: number;
  genre: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch 10 random tracks for the wheel
    const trackResults = await getRandomTracksForWheel(10);

    if (trackResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch tracks. Please try again.' },
        { status: 500 }
      );
    }

    // Transform to wheel track format
    const wheelTracks: WheelTrack[] = trackResults.map(({ track, audioFeatures }) => {
      const stats = calculateCardStats(track, audioFeatures);

      // Determine genre from the search (we don't have it directly, so use a general label)
      const genre = 'mixed';

      return {
        id: track.id,
        songName: track.name,
        artistName: track.artists.map(a => a.name).join(', '),
        albumArtUrl: getBestAlbumArt(track),
        momentum: stats.momentum,
        energy: stats.energy,
        bpm: stats.bpm,
        genre,
      };
    });

    return NextResponse.json({
      tracks: wheelTracks,
      count: wheelTracks.length,
    });
  } catch (error) {
    console.error('Wheel tracks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
