import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Profile, Card, UserCard, Trade, TradeCard, Unboxing, UserDailyStats, LeaderboardEntry } from './types';
import { calculateEnergy } from './types';

// Database schema type for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      cards: {
        Row: Card;
        Insert: Omit<Card, 'id' | 'created_at'>;
        Update: Partial<Omit<Card, 'id' | 'created_at'>>;
      };
      user_cards: {
        Row: UserCard;
        Insert: Omit<UserCard, 'id' | 'acquired_at'>;
        Update: Partial<Omit<UserCard, 'id'>>;
      };
      trades: {
        Row: Trade;
        Insert: Omit<Trade, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Trade, 'id' | 'created_at'>>;
      };
      trade_cards: {
        Row: TradeCard;
        Insert: Omit<TradeCard, 'id'>;
        Update: Partial<Omit<TradeCard, 'id'>>;
      };
      unboxings: {
        Row: Unboxing;
        Insert: Omit<Unboxing, 'id' | 'created_at'>;
        Update: Partial<Omit<Unboxing, 'id'>>;
      };
      user_daily_stats: {
        Row: UserDailyStats;
        Insert: Omit<UserDailyStats, 'id' | 'created_at'>;
        Update: Partial<Omit<UserDailyStats, 'id' | 'created_at'>>;
      };
    };
  };
}

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Client for browser/frontend use (uses anon key)
let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

// SSR-compatible server client with cookie handling for auth sessions
export async function getSupabaseServerClient() {
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing sessions.
        }
      },
    },
  });
}

// Admin client for server-side operations (uses service role key, bypasses RLS)
let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }

  if (!adminClient) {
    adminClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}

// Helper functions for common queries (use admin client for direct DB access)

export async function getUserById(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  return data;
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user by email:', error);
    return null;
  }
  return data;
}

export async function getUserByUsername(username: string): Promise<Profile | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user by username:', error);
    return null;
  }
  return data;
}

export async function getCardBySpotifyId(spotifyTrackId: string): Promise<Card | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('spotify_track_id', spotifyTrackId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching card:', error);
    return null;
  }
  return data;
}

export async function getUserCards(userId: string): Promise<UserCard[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('user_cards')
    .select(`
      *,
      card:cards(*)
    `)
    .eq('user_id', userId)
    .order('acquired_at', { ascending: false });

  if (error) {
    console.error('Error fetching user cards:', error);
    return [];
  }
  return data || [];
}

export async function checkUserOwnsCard(userId: string, cardId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('user_cards')
    .select('id')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking card ownership:', error);
    return false;
  }
  return !!data;
}

// Recalculate a user's energy in real-time and update their profile
export async function recalculateUserEnergy(userId: string): Promise<{ energy: number; momentum: number; cardsCount: number }> {
  const userCards = await getUserCards(userId);
  let totalEnergy = 0;
  let totalMomentum = 0;

  for (const uc of userCards) {
    if (uc.card) {
      totalEnergy += calculateEnergy(uc.card.momentum, uc.card.created_at);
      totalMomentum += uc.card.momentum;
    }
  }

  // Update profiles table with fresh values
  const supabase = getSupabaseAdminClient();
  await supabase
    .from('profiles')
    .update({
      total_energy: totalEnergy,
      total_momentum: totalMomentum,
      cards_collected: userCards.length,
    })
    .eq('id', userId);

  return { energy: totalEnergy, momentum: totalMomentum, cardsCount: userCards.length };
}

// Get leaderboard with real-time energy calculation for all users
export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseAdminClient();

  // Get all users
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, cards_collected');

  if (error) {
    console.error('Error fetching users for leaderboard:', error);
    return [];
  }

  if (!users || users.length === 0) {
    return [];
  }

  // Recalculate energy for each user in parallel
  const leaderboardEntries = await Promise.all(
    users.map(async (user) => {
      const { energy, cardsCount } = await recalculateUserEnergy(user.id);
      return {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        total_energy: energy,
        cards_collected: cardsCount,
      };
    })
  );

  // Sort by energy descending and limit
  return leaderboardEntries
    .sort((a, b) => b.total_energy - a.total_energy)
    .slice(0, limit);
}

// Export convenience accessors
export const supabase = {
  get admin() {
    return getSupabaseAdminClient();
  },
  get browser() {
    return getSupabaseBrowserClient();
  },
};

// ============================================
// Daily Stats Functions
// ============================================

// Calculate current stats for a user (used by ensureTodayStats)
async function calculateCurrentStats(userId: string): Promise<{
  totalEnergy: number;
  totalMomentum: number;
  totalCards: number;
}> {
  const userCards = await getUserCards(userId);

  let totalEnergy = 0;
  let totalMomentum = 0;

  for (const uc of userCards) {
    if (uc.card) {
      totalEnergy += calculateEnergy(uc.card.momentum, uc.card.created_at);
      totalMomentum += uc.card.momentum;
    }
  }

  return {
    totalEnergy,
    totalMomentum,
    totalCards: userCards.length,
  };
}

// Ensure today's stats exist for a user (lazy update strategy)
export async function ensureTodayStats(userId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // Check if today's stats already exist
  const { data: existing } = await supabase
    .from('user_daily_stats')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (!existing) {
    // Calculate current stats
    const stats = await calculateCurrentStats(userId);

    // Insert today's snapshot (use upsert to handle race conditions)
    await supabase.from('user_daily_stats').upsert({
      user_id: userId,
      date: today,
      energy: stats.totalEnergy,
      momentum: stats.totalMomentum,
      cards_count: stats.totalCards,
    }, {
      onConflict: 'user_id,date',
    });

    // Update profiles table with latest totals for leaderboard
    await supabase
      .from('profiles')
      .update({
        total_energy: stats.totalEnergy,
        total_momentum: stats.totalMomentum,
        cards_collected: stats.totalCards,
      })
      .eq('id', userId);

    // Cleanup old data (older than 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    await supabase
      .from('user_daily_stats')
      .delete()
      .eq('user_id', userId)
      .lt('date', cutoffDate.toISOString().split('T')[0]);
  }
}

// Get daily stats for a user within a date range
export async function getDailyStats(
  userId: string,
  days: number = 30
): Promise<UserDailyStats[]> {
  const supabase = getSupabaseAdminClient();

  // Calculate the start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const { data, error } = await supabase
    .from('user_daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching daily stats:', error);
    return [];
  }

  return (data || []) as UserDailyStats[];
}
