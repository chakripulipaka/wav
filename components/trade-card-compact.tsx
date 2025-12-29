"use client"

import { useState } from "react"
import { Zap, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TradeCardCompactProps {
  card: {
    songName: string
    artistName: string
    albumArtUrl?: string
    momentum: number
    energy: number
  }
}

export function TradeCardCompact({ card }: TradeCardCompactProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="relative w-24 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
      style={{
        perspective: "1000px",
        aspectRatio: "3/4",
      }}
    >
      <div
        style={{
          transition: "transform 500ms ease-in-out",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Front - Album Cover, Song, Artist */}
        <Card
          className={cn(
            "overflow-hidden border-border backface-hidden p-0",
            "bg-card transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20",
            "absolute inset-0",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Album Art */}
          <div className="aspect-square overflow-hidden">
            <img
              src={
                card.albumArtUrl ||
                `/placeholder.svg?height=96&width=96&query=${encodeURIComponent(card.songName) || "/placeholder.svg"}`
              }
              alt={card.songName}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Song and Artist */}
          <div className="px-2 pt-0.5 pb-1">
            <h3 className="truncate text-[10px] font-semibold leading-tight">{card.songName}</h3>
            <p className="truncate text-[9px] text-muted-foreground">{card.artistName}</p>
          </div>
        </Card>

        {/* Back - Only Energy and Momentum Icons with Numbers */}
        <Card
          className={cn(
            "overflow-hidden border-border",
            "bg-gradient-to-br from-card via-card to-primary/5",
            "absolute inset-0",
          )}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex h-full flex-col items-center justify-center gap-4 p-2">
            {/* Energy - Icon and Number Only */}
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-bold text-primary">{card.energy}</span>
            </div>

            {/* Momentum - Icon and Number Only */}
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-secondary flex-shrink-0" />
              <span className="text-sm font-bold text-secondary">{card.momentum}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
