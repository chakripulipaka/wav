import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { searchArtists, getBestArtistImage } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameter
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search for artists
    const spotifyArtists = await searchArtists(query, 10);

    // Transform to ArtistPreference format
    const artists = spotifyArtists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      image_url: getBestArtistImage(artist),
    }));

    return NextResponse.json({ artists });
  } catch (error) {
    console.error('Artist search error:', error);
    return NextResponse.json(
      { error: 'Failed to search artists' },
      { status: 500 }
    );
  }
}
