"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import type { BlackjackGameCard } from "@/lib/blackjack-utils"
import { cn } from "@/lib/utils"

interface BlackjackCardProps {
  card?: BlackjackGameCard
  isFlipped?: boolean
  className?: string
}

export function BlackjackCard({ card, isFlipped = true, className }: BlackjackCardProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-muted/30 transition-all",
        "hover:border-primary hover:shadow-[0_0_20px_rgba(255,92,147,0.3)]",
        "w-24 sm:w-28 md:w-32",
        className,
      )}
    >
      {isFlipped && card ? (
        <>
          {/* Square album art */}
          <div className="relative aspect-square">
            <Image
              src={card.album_art_url || "/placeholder.svg"}
              alt={card.song_name}
              fill
              className="object-cover"
            />
          </div>
          {/* Text section - natural height */}
          <div className="p-2 bg-[#181818]">
            <h4 className="truncate text-[10px] sm:text-xs font-semibold text-white">
              {card.song_name}
            </h4>
            <p className="truncate text-[8px] sm:text-[10px] text-muted-foreground">
              {card.artist_name}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[8px] sm:text-[9px] text-muted-foreground">Momentum</span>
              <span className="text-[10px] sm:text-xs font-bold text-secondary">{card.momentum}</span>
            </div>
          </div>
        </>
      ) : (
        /* Back of card - WAV logo */
        <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-[#1DB954] to-[#121212]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-black/40">
            <span className="text-base font-black italic text-white">WAV</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
