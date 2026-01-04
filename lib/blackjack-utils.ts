import type { Card, CardDisplay } from './types';

// Blackjack card type - compatible with both Card and CardDisplay
export interface BlackjackGameCard {
  id: string;
  song_name: string;
  artist_name: string;
  album_art_url: string;
  momentum: number;
}

// Convert Card to BlackjackGameCard
export function cardToBlackjackCard(card: Card): BlackjackGameCard {
  return {
    id: card.id,
    song_name: card.song_name,
    artist_name: card.artist_name,
    album_art_url: card.album_art_url,
    momentum: card.momentum,
  };
}

// Convert CardDisplay to BlackjackGameCard
export function displayToBlackjackCard(card: CardDisplay): BlackjackGameCard {
  return {
    id: card.id,
    song_name: card.songName,
    artist_name: card.artistName,
    album_art_url: card.albumArtUrl,
    momentum: card.momentum,
  };
}

// Calculate total momentum for a hand
export function calculateMomentum(cards: BlackjackGameCard[]): number {
  return cards.reduce((sum, card) => sum + card.momentum, 0);
}

// Bust threshold - player loses if they exceed this value
export const BUST_THRESHOLD = 201;

// Dealer stands at this value
export const DEALER_STAND_THRESHOLD = 150;

// Legacy TrackCard type for backwards compatibility
export interface TrackCard {
  id: string;
  title: string;
  artist: string;
  momentum: number;
  image: string;
}

// Legacy mock tracks (for fallback)
export const MOCK_TRACKS: TrackCard[] = [
  {
    id: "1",
    title: "Honeypie",
    artist: "JAWNY",
    momentum: 67,
    image: "/honeypie-jawny-album-art.jpg",
  },
  {
    id: "2",
    title: "SOMEONE TO YOU",
    artist: "Matt Hansen",
    momentum: 62,
    image: "/someone-to-you-matt-hansen-album-art.jpg",
  },
  {
    id: "3",
    title: "Wash It All Away",
    artist: "Five Finger Death Punch",
    momentum: 47,
    image: "/five-finger-death-punch-album-art.jpg",
  },
  {
    id: "4",
    title: "IV",
    artist: "BADBADNOTGOOD",
    momentum: 42,
    image: "/badbadnotgood-album-art.jpg",
  },
  {
    id: "5",
    title: "Slip",
    artist: "Shubh Saran",
    momentum: 42,
    image: "/shubh-saran-slip-album-art.jpg",
  },
  {
    id: "6",
    title: "Jardin de rosas",
    artist: "Duncan Dhu",
    momentum: 31,
    image: "/duncan-dhu-jardin-de-rosas-album-art.jpg",
  },
  {
    id: "7",
    title: "Stick Season",
    artist: "Noah Kahan",
    momentum: 25,
    image: "/noah-kahan-stick-season-album-art.jpg",
  },
  {
    id: "8",
    title: "Song #3",
    artist: "Stone Sour",
    momentum: 18,
    image: "/stone-sour-song-3-album-art.jpg",
  },
];
