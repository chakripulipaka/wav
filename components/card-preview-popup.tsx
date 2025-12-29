"use client"

import { MusicCard } from "@/components/music-card"

interface CardPreviewPopupProps {
  card: {
    id: number
    songName: string
    artistName: string
    albumArtUrl?: string
    momentum: number
    energy: number
  }
  position: { x: number; y: number }
}

export function CardPreviewPopup({ card, position }: CardPreviewPopupProps) {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="w-48 pointer-events-auto">
        <MusicCard card={card} showDelete={false} />
      </div>
    </div>
  )
}
