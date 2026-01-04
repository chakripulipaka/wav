// Frontend API client for WAV music card trading platform

import type {
  Profile,
  Card,
  Trade,
  ApiResponse,
  LeaderboardEntry,
  UserAnalytics,
  CardDisplay,
  UserCard,
  HistoricalDataPoint,
  AnalyticsHistoryResponse,
  ArtistPreference
} from './types';
import { cardToDisplay } from './types';

// Base fetch wrapper with cookie-based auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for auth
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || data.message || 'Request failed' };
    }

    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export const authApi = {
  async register(username: string, email: string, password: string): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'>; message: string }>> {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  async registerAsGuest(): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'>; message: string }>> {
    return apiFetch('/api/auth/register-guest', {
      method: 'POST',
    });
  },

  async login(email: string, password: string): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'> }>> {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async me(): Promise<ApiResponse<Omit<Profile, 'password_hash'>>> {
    return apiFetch('/api/auth/me');
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return apiFetch('/api/auth/logout', { method: 'POST' });
  },

  async deleteGuest(): Promise<ApiResponse<{ message: string }>> {
    return apiFetch('/api/auth/delete-guest', { method: 'POST' });
  },
};

// Users API
export const usersApi = {
  async getProfile(userId: string): Promise<ApiResponse<Omit<Profile, 'password_hash'>>> {
    return apiFetch(`/api/users/${userId}`);
  },

  async getLeaderboard(): Promise<ApiResponse<LeaderboardEntry[]>> {
    return apiFetch('/api/users/leaderboard');
  },

  async searchUsers(query: string): Promise<ApiResponse<{ id: string; username: string; avatar_url?: string }[]>> {
    return apiFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  },

  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'>; message: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`/api/users/${userId}/avatar`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      console.error('Avatar upload failed:', error);
      return { error: 'Network error. Please try again.' };
    }
  },

  async updateProfile(
    userId: string,
    updates: { deck_privacy?: string; trade_privacy?: string }
  ): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'> }>> {
    return apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updatePreferences(
    userId: string,
    preferences: {
      top_genres?: string[];
      top_artists?: ArtistPreference[];
    }
  ): Promise<ApiResponse<{ user: Omit<Profile, 'password_hash'> }>> {
    return apiFetch(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// Cards API
export const cardsApi = {
  async getAll(page: number = 1, limit: number = 20): Promise<ApiResponse<{ cards: Card[]; total: number }>> {
    return apiFetch(`/api/cards?page=${page}&limit=${limit}`);
  },

  async getById(cardId: string): Promise<ApiResponse<Card>> {
    return apiFetch(`/api/cards/${cardId}`);
  },

  async getUserCards(userId: string): Promise<ApiResponse<CardDisplay[]>> {
    const result = await apiFetch<UserCard[]>(`/api/cards/user/${userId}`);

    if (result.error) {
      return { error: result.error };
    }

    // Transform to display format
    const cards = result.data
      ?.filter((uc) => uc.card)
      .map((uc) => cardToDisplay(uc.card!)) || [];

    return { data: cards };
  },

  async getTopCards(limit: number = 10): Promise<ApiResponse<(Card & { num_owned: number })[]>> {
    return apiFetch(`/api/cards/top?limit=${limit}`);
  },
};

// Wheel track type for the unbox wheel
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

// Unbox API
export const unboxApi = {
  // Legacy: unbox by category
  async unbox(category: string): Promise<ApiResponse<{ card: CardDisplay; isNew: boolean }>> {
    const result = await apiFetch<{ card: Card; isNew: boolean }>('/api/unbox', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });

    if (result.error) {
      return { error: result.error };
    }

    if (result.data) {
      return {
        data: {
          card: cardToDisplay(result.data.card),
          isNew: result.data.isNew,
        },
      };
    }

    return { error: 'Unknown error' };
  },

  // New: unbox from wheel with selected track
  async unboxFromWheel(track: WheelTrack): Promise<ApiResponse<{ card: CardDisplay; isNew: boolean }>> {
    const result = await apiFetch<{ card: Card; isNew: boolean }>('/api/unbox', {
      method: 'POST',
      body: JSON.stringify({
        wheelTrack: {
          spotifyTrackId: track.id,
          songName: track.songName,
          artistName: track.artistName,
          albumArtUrl: track.albumArtUrl,
          momentum: track.momentum,
          bpm: track.bpm,
        },
      }),
    });

    if (result.error) {
      return { error: result.error };
    }

    if (result.data) {
      return {
        data: {
          card: cardToDisplay(result.data.card),
          isNew: result.data.isNew,
        },
      };
    }

    return { error: 'Unknown error' };
  },

  // Get wheel tracks (10 random songs)
  async getWheelTracks(): Promise<ApiResponse<{ tracks: WheelTrack[]; count: number }>> {
    return apiFetch('/api/unbox/wheel');
  },

  async getCooldown(): Promise<ApiResponse<{ canUnbox: boolean; nextUnboxTime?: string }>> {
    return apiFetch('/api/unbox/cooldown');
  },
};

// Trades API
export const tradesApi = {
  async create(
    receiverId: string,
    senderCardIds: string[],
    receiverCardIds: string[]
  ): Promise<ApiResponse<Trade>> {
    return apiFetch('/api/trades', {
      method: 'POST',
      body: JSON.stringify({ receiverId, senderCardIds, receiverCardIds }),
    });
  },

  async getAll(): Promise<ApiResponse<Trade[]>> {
    return apiFetch('/api/trades');
  },

  async getSent(): Promise<ApiResponse<Trade[]>> {
    return apiFetch('/api/trades/sent');
  },

  async getReceived(): Promise<ApiResponse<Trade[]>> {
    return apiFetch('/api/trades/received');
  },

  async accept(tradeId: string): Promise<ApiResponse<Trade>> {
    return apiFetch(`/api/trades/${tradeId}/accept`, {
      method: 'PUT',
    });
  },

  async decline(tradeId: string): Promise<ApiResponse<Trade>> {
    return apiFetch(`/api/trades/${tradeId}/decline`, {
      method: 'PUT',
    });
  },
};

// Analytics API
export const analyticsApi = {
  async getUserAnalytics(userId: string): Promise<ApiResponse<UserAnalytics>> {
    return apiFetch(`/api/analytics/user/${userId}`);
  },

  async getHistory(
    userId: string,
    timeScale: 'day' | 'week' | 'month'
  ): Promise<ApiResponse<AnalyticsHistoryResponse>> {
    return apiFetch(`/api/analytics/user/${userId}/history?timeScale=${timeScale}`);
  },
};

// Energy API (for games like blackjack)
export const energyApi = {
  async getEnergy(userId: string): Promise<ApiResponse<{ energy: number }>> {
    return apiFetch(`/api/users/${userId}/energy`);
  },

  async updateEnergy(
    userId: string,
    amount: number,
    reason?: string
  ): Promise<ApiResponse<{ success: boolean; previousEnergy: number; newEnergy: number; change: number }>> {
    return apiFetch(`/api/users/${userId}/energy`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  },
};

// Blackjack API (for card win/lose mechanics)
export const blackjackApi = {
  async getDeck(): Promise<ApiResponse<{ deck: { id: string; song_name: string; artist_name: string; album_art_url: string; momentum: number }[] }>> {
    return apiFetch('/api/blackjack/deck');
  },

  async removeCard(
    userId: string,
    cardId: string
  ): Promise<ApiResponse<{ success: boolean; message: string; cardId: string }>> {
    return apiFetch(`/api/cards/user/${userId}/${cardId}`, {
      method: 'DELETE',
    });
  },

  async claimCards(
    cards: { id: string; song_name: string; artist_name: string; album_art_url: string; momentum: number }[]
  ): Promise<ApiResponse<{ success: boolean; message: string; addedCards: string[]; skipped: number }>> {
    return apiFetch('/api/blackjack/claim', {
      method: 'POST',
      body: JSON.stringify({ cards }),
    });
  },
};

// Spotify API (for artist search)
export const spotifyApi = {
  async searchArtists(query: string): Promise<ApiResponse<{ artists: ArtistPreference[] }>> {
    return apiFetch(`/api/spotify/search/artists?q=${encodeURIComponent(query)}`);
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  users: usersApi,
  cards: cardsApi,
  unbox: unboxApi,
  trades: tradesApi,
  analytics: analyticsApi,
  energy: energyApi,
  blackjack: blackjackApi,
  spotify: spotifyApi,
};

export default api;
