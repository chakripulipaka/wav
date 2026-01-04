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

// Batch fetch audio features for multiple tracks in ONE API call
export async function getBatchAudioFeatures(
  trackIds: string // comma-separated IDs
): Promise<Map<string, SpotifyAudioFeatures>> {
  if (!trackIds) {
    return new Map();
  }

  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Batch audio features failed:', response.status);
    return new Map();
  }

  const data = await response.json();
  const map = new Map<string, SpotifyAudioFeatures>();

  for (const features of data.audio_features || []) {
    if (features) {
      map.set(features.id, features);
    }
  }

  return map;
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
// Momentum: 1-100, directly from Spotify popularity
// Energy: Cards start at 0 energy, grows by momentum each hour (max 100,000)
export function calculateCardStats(
  track: SpotifyTrack,
  audioFeatures: SpotifyAudioFeatures | null
): {
  energy: number;
  momentum: number;
  bpm: number;
} {
  // Momentum = Spotify popularity × random multiplier (1x to 1.5x), capped at 100
  const multiplier = 1 + Math.random() * 0.5; // Random value between 1.0 and 1.5
  const momentum = Math.max(1, Math.min(100, Math.round(track.popularity * multiplier)));

  // Energy: Cards start at 0, will grow by momentum each hour
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
// Optimized: Fetches all searches in PARALLEL, then batch fetches audio features
export async function getRandomTracksForWheel(count: number = 10): Promise<Array<{
  track: SpotifyTrack;
  audioFeatures: SpotifyAudioFeatures | null;
}>> {
  const allGenres = Object.keys(GENRE_QUERIES);

  // 1. Pick random genres (extra for fallback in case some searches fail)
  const selectedGenres = Array.from({ length: count + 5 }, () =>
    allGenres[Math.floor(Math.random() * allGenres.length)]
  );

  // 2. Fetch all searches IN PARALLEL (major performance improvement)
  const searchPromises = selectedGenres.map(genre =>
    searchTracksByGenre(genre, 50).catch(() => [] as SpotifyTrack[])
  );
  const searchResults = await Promise.all(searchPromises);

  // 3. Pick unique random tracks from results
  const usedIds = new Set<string>();
  const selectedTracks: SpotifyTrack[] = [];

  for (const tracks of searchResults) {
    if (selectedTracks.length >= count) break;

    // Filter to valid tracks we haven't used yet
    const validTracks = tracks.filter(
      t => t.album.images.length > 0 && t.artists.length > 0 && !usedIds.has(t.id)
    );

    if (validTracks.length > 0) {
      // Pick a random track from this genre's results
      const track = validTracks[Math.floor(Math.random() * validTracks.length)];
      usedIds.add(track.id);
      selectedTracks.push(track);
    }
  }

  if (selectedTracks.length < count) {
    console.warn(`Only got ${selectedTracks.length}/${count} tracks for wheel`);
  }

  if (selectedTracks.length === 0) {
    return [];
  }

  // 4. Batch fetch audio features (ONE API call for all tracks instead of 10)
  const trackIds = selectedTracks.map(t => t.id).join(',');
  const audioFeaturesMap = await getBatchAudioFeatures(trackIds);

  // 5. Combine tracks with their audio features
  return selectedTracks.map(track => ({
    track,
    audioFeatures: audioFeaturesMap.get(track.id) || null
  }));
}

// Export available genres
export const AVAILABLE_GENRES = Object.keys(GENRE_QUERIES);

// Interface for artist search results
export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  popularity: number;
  genres: string[];
}

// Search for artists by name
export async function searchArtists(query: string, limit: number = 10): Promise<SpotifyArtist[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Artist search failed:', error);
    return [];
  }

  const data = await response.json();
  return data.artists?.items || [];
}

// Get best artist image URL
export function getBestArtistImage(artist: SpotifyArtist): string | undefined {
  const images = artist.images;
  if (images.length === 0) {
    return undefined;
  }

  // Sort by size descending and get medium-sized image
  const sorted = [...images].sort((a, b) => b.width - a.width);
  const preferred = sorted.find((img) => img.width >= 160 && img.width <= 320);
  return preferred?.url || sorted[0].url;
}

// Get top tracks from a specific artist
export async function getArtistTopTracks(artistId: string): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();

  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to get artist top tracks:', response.status);
    return [];
  }

  const data = await response.json();
  return data.tracks || [];
}

// Search for tracks by a specific artist using search endpoint (gets full catalog including deep cuts)
export async function searchArtistTracks(
  artistId: string,
  artistName: string,
  limit: number = 50
): Promise<SpotifyTrack[]> {
  const token = await getSpotifyToken();

  // Use random offset to get different tracks each time (like genre searches do)
  const randomOffset = Math.floor(Math.random() * 100);

  // Search for tracks by this artist
  const response = await fetch(
    `https://api.spotify.com/v1/search?` +
      new URLSearchParams({
        q: `artist:"${artistName}"`,
        type: 'track',
        limit: limit.toString(),
        offset: randomOffset.toString(),
        market: 'US',
      }),
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error('Failed to search artist tracks:', response.status);
    // Fallback to top tracks if search fails
    return getArtistTopTracks(artistId);
  }

  const data = await response.json();
  const tracks = data.tracks?.items || [];

  // Filter to ensure album art and valid artists
  return tracks.filter(
    (t: SpotifyTrack) => t.album?.images?.length > 0 && t.artists?.length > 0
  );
}

// Get tracks from multiple preferred artists
export async function getTracksFromArtists(
  artists: Array<{ id: string; name: string }>,
  count: number
): Promise<SpotifyTrack[]> {
  if (artists.length === 0) return [];

  // Fetch tracks from each artist using search (gets deep cuts too)
  const trackPromises = artists.map((artist) =>
    searchArtistTracks(artist.id, artist.name, 50).catch(() => [] as SpotifyTrack[])
  );
  const allArtistTracks = await Promise.all(trackPromises);

  // Collect all valid tracks
  const allTracks: SpotifyTrack[] = [];
  for (const tracks of allArtistTracks) {
    const validTracks = tracks.filter(
      (t) => t.album.images.length > 0 && t.artists.length > 0
    );
    allTracks.push(...validTracks);
  }

  // Shuffle and return requested count
  const shuffled = allTracks.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get tracks with genre bias (biasStrength = 0.75 means 75% from preferred genres)
export async function getGenreBiasedTracks(
  preferredGenres: string[],
  count: number,
  biasStrength: number = 0.75
): Promise<SpotifyTrack[]> {
  const allGenres = Object.keys(GENRE_QUERIES);

  // Calculate how many tracks from preferred vs random genres
  const preferredCount =
    preferredGenres.length > 0 ? Math.round(count * biasStrength) : 0;
  const randomCount = count - preferredCount;

  // Select genres to search
  const genresToSearch: string[] = [];

  // Add preferred genres
  for (let i = 0; i < preferredCount; i++) {
    const genre = preferredGenres[Math.floor(Math.random() * preferredGenres.length)];
    genresToSearch.push(genre);
  }

  // Add random genres
  for (let i = 0; i < randomCount; i++) {
    const genre = allGenres[Math.floor(Math.random() * allGenres.length)];
    genresToSearch.push(genre);
  }

  // Fetch tracks from all genres in parallel
  const searchPromises = genresToSearch.map((genre) =>
    searchTracksByGenre(genre, 50).catch(() => [] as SpotifyTrack[])
  );
  const searchResults = await Promise.all(searchPromises);

  // Pick unique random tracks from results
  const usedIds = new Set<string>();
  const selectedTracks: SpotifyTrack[] = [];

  for (const tracks of searchResults) {
    if (selectedTracks.length >= count) break;

    const validTracks = tracks.filter(
      (t) => t.album.images.length > 0 && t.artists.length > 0 && !usedIds.has(t.id)
    );

    if (validTracks.length > 0) {
      const track = validTracks[Math.floor(Math.random() * validTracks.length)];
      usedIds.add(track.id);
      selectedTracks.push(track);
    }
  }

  return selectedTracks;
}

// Get tracks with user preferences applied (artist bias + genre bias)
// artistBias: 0.5 = 50% from preferred artists
// genreBias: 0.75 = 75% of remaining from preferred genres
export async function getTracksWithPreferences(
  preferredArtists: Array<{ id: string; name: string }>,
  preferredGenres: string[],
  count: number,
  artistBias: number = 0.5,
  genreBias: number = 0.75
): Promise<Array<{ track: SpotifyTrack; audioFeatures: SpotifyAudioFeatures | null }>> {
  const usedIds = new Set<string>();
  const selectedTracks: SpotifyTrack[] = [];

  // Calculate artist track count
  const artistCount =
    preferredArtists.length > 0 ? Math.round(count * artistBias) : 0;
  const genreCount = count - artistCount;

  // Get tracks from preferred artists
  if (artistCount > 0) {
    const artistTracks = await getTracksFromArtists(preferredArtists, artistCount);
    for (const track of artistTracks) {
      if (!usedIds.has(track.id)) {
        usedIds.add(track.id);
        selectedTracks.push(track);
      }
    }
  }

  // Fill remaining with genre-biased tracks
  const remaining = count - selectedTracks.length;
  if (remaining > 0) {
    const genreTracks = await getGenreBiasedTracks(preferredGenres, remaining + 5, genreBias);
    for (const track of genreTracks) {
      if (selectedTracks.length >= count) break;
      if (!usedIds.has(track.id)) {
        usedIds.add(track.id);
        selectedTracks.push(track);
      }
    }
  }

  if (selectedTracks.length === 0) {
    return [];
  }

  // Batch fetch audio features
  const trackIds = selectedTracks.map((t) => t.id).join(',');
  const audioFeaturesMap = await getBatchAudioFeatures(trackIds);

  // Shuffle and return with audio features
  const shuffled = selectedTracks.sort(() => Math.random() - 0.5);
  return shuffled.map((track) => ({
    track,
    audioFeatures: audioFeaturesMap.get(track.id) || null,
  }));
}
