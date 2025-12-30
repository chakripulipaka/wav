// Spotify API service for WAV music card trading platform

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  preview_url: string | null;
  popularity: number;
  duration_ms: number;
}

interface SpotifyAudioFeatures {
  id: string;
  energy: number; // 0.0 to 1.0
  tempo: number; // BPM
  danceability: number;
  valence: number;
  loudness: number;
  speechiness: number;
  instrumentalness: number;
}

interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

// Token cache
let cachedToken: SpotifyToken | null = null;

// Genre to search query mapping for better results
const GENRE_QUERIES: Record<string, string[]> = {
  rap: ['hip hop', 'rap', 'trap', 'drill'],
  pop: ['pop', 'dance pop', 'synth pop'],
  rock: ['rock', 'alternative rock', 'indie rock'],
  electronic: ['electronic', 'edm', 'house', 'techno'],
  rnb: ['r&b', 'soul', 'neo soul'],
  jazz: ['jazz', 'smooth jazz', 'jazz fusion'],
  country: ['country', 'country pop', 'americana'],
  latin: ['latin', 'reggaeton', 'latin pop'],
  indie: ['indie', 'indie pop', 'indie folk'],
  metal: ['metal', 'heavy metal', 'hard rock'],
};

async function getSpotifyToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify API credentials');
  }

  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  // Get new token using client credentials flow
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Spotify token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

export async function searchTracksByGenre(
  genre: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();

  // Get search queries for the genre
  const queries = GENRE_QUERIES[genre.toLowerCase()] || [genre];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];

  // Add some randomization to get different results
  const randomOffset = Math.floor(Math.random() * 100);
  const randomYear = 2015 + Math.floor(Math.random() * 10); // 2015-2024

  // Build search query with genre and year filter for variety
  const searchQuery = `genre:${randomQuery} year:${randomYear - 2}-${randomYear + 2}`;

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=${limit}&offset=${randomOffset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify search failed: ${error}`);
  }

  const data: SpotifySearchResult = await response.json();
  return data.tracks.items;
}

export async function getTrackDetails(trackId: string): Promise<SpotifyTrack | null> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/tracks/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.text();
    throw new Error(`Failed to get track details: ${error}`);
  }

  return response.json();
}

export async function getAudioFeatures(trackId: string): Promise<SpotifyAudioFeatures | null> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/audio-features/${trackId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    // Return null for 404 (not found) or 403 (forbidden/unavailable)
    // Some tracks don't have audio features available
    if (response.status === 404 || response.status === 403) {
      console.log(`Audio features not available for track ${trackId} (status: ${response.status})`);
      return null;
    }
    const error = await response.text();
    throw new Error(`Failed to get audio features: ${error}`);
  }

  return response.json();
}

export async function getRandomTrackForGenre(genre: string): Promise<{
  track: SpotifyTrack;
  audioFeatures: SpotifyAudioFeatures | null;
} | null> {
  try {
    // Search for tracks in the genre
    const tracks = await searchTracksByGenre(genre, 50);

    if (tracks.length === 0) {
      return null;
    }

    // Filter to tracks with album art and pick a random one
    const validTracks = tracks.filter(
      (t) => t.album.images.length > 0 && t.artists.length > 0
    );

    if (validTracks.length === 0) {
      return null;
    }

    const randomTrack = validTracks[Math.floor(Math.random() * validTracks.length)];

    // Get audio features for the track
    const audioFeatures = await getAudioFeatures(randomTrack.id);

    return {
      track: randomTrack,
      audioFeatures,
    };
  } catch (error) {
    console.error('Error getting random track:', error);
    return null;
  }
}

// Calculate card stats from Spotify data
// Momentum: 1-100, represents hype/popularity, heavily weighted by Spotify popularity
// Energy: Cards start at 0 energy, grows by momentum each hour (max 100,000)
export function calculateCardStats(
  track: SpotifyTrack,
  audioFeatures: SpotifyAudioFeatures | null
): {
  energy: number;
  momentum: number;
  bpm: number;
} {
  // Momentum calculation (1-100):
  // Weighted formula: 50% popularity + 20% energy + 15% danceability + 15% tempo_normalized
  // With some randomness (±8) but not extreme variance

  const popularity = track.popularity; // 0-100 from Spotify

  // Get audio feature values, or use reasonable defaults
  const spotifyEnergy = audioFeatures ? audioFeatures.energy * 100 : 50;
  const danceability = audioFeatures ? audioFeatures.danceability * 100 : 50;
  const tempo = audioFeatures ? audioFeatures.tempo : 120;

  // Normalize tempo to 0-100 scale (60 BPM = 0, 180 BPM = 100)
  const tempoNormalized = Math.max(0, Math.min(100, ((tempo - 60) / 120) * 100));

  // Weighted momentum calculation
  const baseMomentum =
    (popularity * 0.50) +          // 50% weight on popularity (biggest factor)
    (spotifyEnergy * 0.20) +       // 20% weight on energy
    (danceability * 0.15) +        // 15% weight on danceability
    (tempoNormalized * 0.15);      // 15% weight on tempo

  // Add randomness (±8) for variety between cards of similar tracks
  const momentumVariance = Math.floor(Math.random() * 17) - 8;
  const momentum = Math.max(1, Math.min(100, Math.round(baseMomentum + momentumVariance)));

  // Energy: Cards start at 0, will grow by momentum each hour
  // This is the INITIAL energy value
  const energy = 0;

  // BPM: From audio features tempo, or estimate
  const bpm = audioFeatures
    ? Math.round(audioFeatures.tempo)
    : 120 + Math.floor(Math.random() * 40); // Default 120-160 BPM

  return { energy, momentum, bpm };
}

// Get best album art URL (prefer 300x300 or larger)
export function getBestAlbumArt(track: SpotifyTrack): string {
  const images = track.album.images;
  if (images.length === 0) {
    return '/default-album-art.jpg';
  }

  // Sort by size descending and get medium-sized image
  const sorted = [...images].sort((a, b) => b.width - a.width);

  // Prefer 300x300 size, fallback to largest
  const preferred = sorted.find((img) => img.width >= 300 && img.width <= 640);
  return preferred?.url || sorted[0].url;
}

// Get multiple random tracks for the wheel (10 unique tracks from mixed genres)
export async function getRandomTracksForWheel(count: number = 10): Promise<Array<{
  track: SpotifyTrack;
  audioFeatures: SpotifyAudioFeatures | null;
}>> {
  const results: Array<{
    track: SpotifyTrack;
    audioFeatures: SpotifyAudioFeatures | null;
  }> = [];

  const usedTrackIds = new Set<string>();
  const allGenres = Object.keys(GENRE_QUERIES);

  // Try to get unique tracks from different genres
  let attempts = 0;
  const maxAttempts = count * 3; // Allow some retries for uniqueness

  while (results.length < count && attempts < maxAttempts) {
    attempts++;

    // Pick a random genre
    const randomGenre = allGenres[Math.floor(Math.random() * allGenres.length)];

    try {
      const trackResult = await getRandomTrackForGenre(randomGenre);

      if (trackResult && !usedTrackIds.has(trackResult.track.id)) {
        usedTrackIds.add(trackResult.track.id);
        results.push(trackResult);
      }
    } catch (error) {
      console.error(`Error fetching track for wheel (genre: ${randomGenre}):`, error);
      // Continue trying other genres
    }
  }

  // If we still don't have enough tracks, fill with whatever we can get
  if (results.length < count) {
    console.warn(`Only got ${results.length}/${count} tracks for wheel`);
  }

  return results;
}

// Export available genres
export const AVAILABLE_GENRES = Object.keys(GENRE_QUERIES);
