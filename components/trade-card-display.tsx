"use client"

import { ArrowRightLeft } from "lucide-react"
import { MusicCard } from "@/components/music-card"

interface TradeCard {
  songName: string
  artistName: string
  albumArtUrl?: string
  momentum: number
  energy: number
}

interface TradeCardDisplayProps {
  givenCards: TradeCard[]
  receivedCards: TradeCard[]
  tradedWith: string
  timeAgo: string
}

export function TradeCardDisplay({ givenCards, receivedCards, tradedWith, timeAgo }: TradeCardDisplayProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-semibold">Traded with {tradedWith}</p>
          <p className="text-sm text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4">
        <div className="inline-flex items-center justify-center gap-6 min-w-full px-6">
          {/* Given Cards Section (max 3) */}
          <div className="flex items-center gap-4">
            {givenCards.slice(0, 3).map((card, idx) => (
              <div key={`gave-${idx}`} className="w-[180px] flex-shrink-0">
                <MusicCard
                  card={{
                    id: idx,
                    songName: card.songName,
                    artistName: card.artistName,
                    albumArtUrl: card.albumArtUrl,
                    momentum: card.momentum,
                    energy: card.energy,
                  }}
                  showDelete={false}
                />
              </div>
            ))}
          </div>

          {/* Exchange Symbol */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center rounded-full bg-primary/20 p-3">
              <ArrowRightLeft className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Received Cards Section (max 3) */}
          <div className="flex items-center gap-4">
            {receivedCards.slice(0, 3).map((card, idx) => (
              <div key={`received-${idx}`} className="w-[180px] flex-shrink-0">
                <MusicCard
                  card={{
                    id: idx + 100,
                    songName: card.songName,
                    artistName: card.artistName,
                    albumArtUrl: card.albumArtUrl,
                    momentum: card.momentum,
                    energy: card.energy,
                  }}
                  showDelete={false}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
