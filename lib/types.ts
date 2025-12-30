// Database types for WAV music card trading platform

export interface Profile {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  total_energy: number;
  total_momentum: number;
  cards_collected: number;
  trades_completed: number;
  deck_privacy: 'public' | 'private';
  trade_privacy: 'public' | 'private';
  last_unbox_time?: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  spotify_track_id: string;
  song_name: string;
  artist_name: string;
  album_name: string;
  album_art_url: string;
  preview_url?: string;
  energy: number;
  momentum: number;
  bpm: number;
  genre: string;
  popularity: number;
  created_at: string;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  acquired_at: string;
  acquired_via: 'unbox' | 'trade';
  card?: Card; // Joined from cards table
}

export interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
  sender_cards?: TradeCard[];
  receiver_cards?: TradeCard[];
}

export interface TradeCard {
  id: string;
  trade_id: string;
  card_id: string;
  owner_type: 'sender' | 'receiver';
  card?: Card;
}

export interface Unboxing {
  id: string;
  user_id: string;
  card_id: string;
  category: string;
  created_at: string;
  card?: Card;
}

export interface UserDailyStats {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD format
  energy: number;
  momentum: number;
  cards_count: number;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  user: Omit<Profile, 'password_hash'>;
  token: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url?: string;
  total_energy: number;
  cards_collected: number;
}

export interface UserAnalytics {
  totalCards: number;
  totalEnergy: number;
  totalMomentum: number;
  avgBpm: number;
  genreDistribution: { genre: string; count: number }[];
  recentTrades: Trade[];
  deckPrivacy: 'public' | 'private';
  tradePrivacy: 'public' | 'private';
  isOwner: boolean;
}

// Historical data point for analytics charts
export interface HistoricalDataPoint {
  date: string; // ISO date string (e.g., "2025-12-23")
  energy: number;
  momentum: number;
}

// Analytics history response
export interface AnalyticsHistoryResponse {
  data: HistoricalDataPoint[];
  timeScale: 'day' | 'week' | 'month';
}

// Frontend card type (matches existing UI)
export interface CardDisplay {
  id: string;
  songName: string;
  artistName: string;
  albumArtUrl: string;
  momentum: number;
  energy: number;
  bpm: number;
  genre?: string;
}

// Maximum energy a card can have
const MAX_ENERGY = 100000;

// Calculate energy based on momentum and time since creation
// Formula: energy = momentum × hours_since_creation (capped at MAX_ENERGY)
export function calculateEnergy(momentum: number, createdAt: string): number {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - createdTime) / (1000 * 60 * 60); // Convert ms to hours

  const calculatedEnergy = Math.floor(momentum * hoursElapsed);
  return Math.min(calculatedEnergy, MAX_ENERGY);
}

// Calculate energy at a specific point in time (for historical data)
// Returns energy the card had at the given timestamp
export function calculateEnergyAtTime(momentum: number, createdAt: string, atTime: Date): number {
  const createdTime = new Date(createdAt).getTime();
  const targetTime = atTime.getTime();

  // If card was created after the target time, it contributes 0
  if (createdTime > targetTime) {
    return 0;
  }

  const hoursElapsed = (targetTime - createdTime) / (1000 * 60 * 60);
  const calculatedEnergy = Math.floor(momentum * hoursElapsed);
  return Math.min(calculatedEnergy, MAX_ENERGY);
}

// Transform database card to display format
// Energy is calculated on-demand based on momentum and time since creation
export function cardToDisplay(card: Card): CardDisplay {
  return {
    id: card.id,
    songName: card.song_name,
    artistName: card.artist_name,
    albumArtUrl: card.album_art_url,
    momentum: card.momentum,
    energy: calculateEnergy(card.momentum, card.created_at),
    bpm: card.bpm,
    genre: card.genre,
  };
}

// Transform user card with joined card data to display format
export function userCardToDisplay(userCard: UserCard): CardDisplay | null {
  if (!userCard.card) return null;
  return cardToDisplay(userCard.card);
}

// Frontend trade display type (for UI components)
export interface TradeDisplay {
  id: string;
  from: string; // username
  fromId: string; // user ID
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  timestamp: string; // relative time like "2 minutes ago"
  expiresAt: string; // ISO timestamp when trade expires (24h from creation)
  isSent: boolean; // whether current user sent this trade
  offering: CardDisplay[];
  requesting: CardDisplay[];
}

// Format timestamp to relative time
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
}

// Calculate trade expiration time (24 hours from creation)
export function calculateTradeExpiresAt(createdAt: string): string {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

// Check if a trade has expired by time (24 hours)
export function isTradeExpiredByTime(createdAt: string): boolean {
  const expiresAt = new Date(calculateTradeExpiresAt(createdAt));
  return new Date() >= expiresAt;
}

// Transform Trade from API to display format
export function transformTradeForDisplay(trade: Trade, currentUserId: string): TradeDisplay {
  const isSender = trade.sender_id === currentUserId;
  const otherUser = isSender ? trade.receiver : trade.sender;
  const expiresAt = calculateTradeExpiresAt(trade.created_at);

  // Check if trade should be marked as expired (only for pending trades)
  let status = trade.status;
  if (status === 'pending' && isTradeExpiredByTime(trade.created_at)) {
    status = 'expired';
  }

  return {
    id: trade.id,
    from: otherUser?.username || 'Unknown User',
    fromId: isSender ? trade.receiver_id : trade.sender_id,
    status,
    timestamp: formatRelativeTime(trade.created_at),
    expiresAt,
    isSent: isSender,
    offering: (isSender
      ? trade.receiver_cards?.map((tc) => tc.card).filter(Boolean)
      : trade.sender_cards?.map((tc) => tc.card).filter(Boolean)
    )?.map(cardToDisplay) || [],
    requesting: (isSender
      ? trade.sender_cards?.map((tc) => tc.card).filter(Boolean)
      : trade.receiver_cards?.map((tc) => tc.card).filter(Boolean)
    )?.map(cardToDisplay) || [],
  };
}
