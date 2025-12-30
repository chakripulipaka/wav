"use client"

import { useState } from "react"
import { Trash2, TrendingUp, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MusicCardProps {
  card: {
    id?: string | number
    songName: string
    artistName: string
    albumArtUrl?: string
    momentum: number
    energy: number
    bpm?: number
  }
  onDelete?: () => void
  showDelete?: boolean
}

// Format energy for display (e.g., 1.5K, 50K, 100K)
function formatEnergy(energy: number): string {
  if (energy >= 100000) {
    return "MAX";
  }
  if (energy >= 1000) {
    const k = energy / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return energy.toString();
}

export function MusicCard({ card, onDelete, showDelete = true }: MusicCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="group relative">
      {/* Delete Button */}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-lg transition-opacity hover:scale-110 group-hover:opacity-100"
          aria-label="Delete card"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Card with 3D Flip */}
      <div
        className="relative h-full cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          perspective: "1000px",
          minHeight: "200px",
        }}
      >
        <div
          style={{
            transition: "transform 500ms ease-in-out",
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front of Card - Only album art, title, and artist */}
          <Card
            className={cn(
              "overflow-hidden border-border backface-hidden p-0",
              "bg-card transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/20",
            )}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={
                  card.albumArtUrl || `/placeholder.svg?height=200&width=200&query=${encodeURIComponent(card.songName)}`
                }
                alt={card.songName}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="px-3 pt-0.5 pb-2">
              <h3 className="truncate text-xs font-semibold leading-tight">{card.songName}</h3>
              <p className="truncate text-[11px] text-muted-foreground">{card.artistName}</p>
            </div>
          </Card>

          {/* Back of Card - Shows all stats */}
          <Card
            className={cn("overflow-hidden border-border", "bg-gradient-to-br from-card via-card to-primary/5")}
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute",
              inset: 0,
            }}
          >
            <div className="flex h-full flex-col p-3 pt-2">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-12 w-12 overflow-hidden rounded-lg flex-shrink-0">
                  <img
                    src={
                      card.albumArtUrl ||
                      `/placeholder.svg?height=48&width=48&query=${encodeURIComponent(card.songName) || "/placeholder.svg"}`
                    }
                    alt={card.songName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-semibold">{card.songName}</h3>
                  <p className="truncate text-xs text-muted-foreground">{card.artistName}</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Energy</span>
                  </div>
                  <span className={cn(
                    "text-lg font-bold text-right ml-2",
                    card.energy >= 100000 ? "text-yellow-400" : "text-primary"
                  )}>
                    {formatEnergy(card.energy)}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">Momentum</span>
                  </div>
                  <span className="text-lg font-bold text-secondary text-right ml-2">{card.momentum}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
