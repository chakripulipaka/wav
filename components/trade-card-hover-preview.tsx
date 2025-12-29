"use client"

import { Card } from "@/components/ui/card"

interface TradeCardHoverPreviewProps {
  card: {
    id: number
    songName: string
    artistName: string
    albumArtUrl: string
    momentum: number
    energy: number
  }
  position: { x: number; y: number }
}

export function TradeCardHoverPreview({ card, position }: TradeCardHoverPreviewProps) {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(0, -50%)",
      }}
    >
      <Card className="w-[280px] overflow-hidden border-2 border-secondary bg-card shadow-2xl shadow-secondary/20 animate-in fade-in zoom-in duration-200">
        <div className="aspect-square overflow-hidden">
          <img
            src={card.albumArtUrl || "/placeholder.svg"}
            alt={card.songName}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-4">
          <h3 className="text-lg font-bold">{card.songName}</h3>
          <p className="text-sm text-muted-foreground">{card.artistName}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-card/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">Momentum</p>
              <p className="text-xl font-bold text-secondary">{card.momentum}</p>
            </div>
            <div className="rounded-lg bg-card/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">Energy</p>
              <p className="text-xl font-bold text-primary">{card.energy}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
