"use client"

import Link from "next/link"
import { Lock, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { CardDisplay } from "@/lib/types"

interface DeckPreviewProps {
  cards: CardDisplay[]
  userId: string
  username: string
  isPrivate: boolean
  isOwner: boolean
}

export function DeckPreview({ cards, userId, username, isPrivate, isOwner }: DeckPreviewProps) {
  // If deck is private and viewer is not the owner
  if (isPrivate && !isOwner) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium text-muted-foreground">
              {username}&apos;s deck is private
            </p>
            <p className="text-sm text-muted-foreground/70">
              Only {username} can view their deck
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // If no cards
  if (!cards || cards.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
          <p className="font-medium text-muted-foreground">No cards yet</p>
          <p className="text-sm text-muted-foreground/70">
            {isOwner ? "Head to the Unbox tab to get some cards!" : "This user hasn't collected any cards yet."}
          </p>
        </div>
      </Card>
    )
  }

  // Show first 6 cards
  const previewCards = cards.slice(0, 6)
  const remainingCount = cards.length - previewCards.length

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{isOwner ? "My Deck" : `${username}'s Deck`}</h3>
          <Link
            href={isOwner ? "/deck" : `/deck/${userId}`}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View Full Deck
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Card thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {previewCards.map((card) => (
            <div
              key={card.id}
              className={cn(
                "relative flex-shrink-0 overflow-hidden rounded-lg border border-border",
                "w-20 aspect-square transition-all hover:border-primary hover:shadow-md"
              )}
            >
              <img
                src={card.albumArtUrl || `/placeholder.svg?height=80&width=80`}
                alt={card.songName}
                className="h-full w-full object-cover"
              />
              {/* Overlay with song name on hover */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity hover:opacity-100">
                <p className="w-full truncate px-1 pb-1 text-[10px] text-white">
                  {card.songName}
                </p>
              </div>
            </div>
          ))}

          {/* Show remaining count if more cards */}
          {remainingCount > 0 && (
            <Link
              href={isOwner ? "/deck" : `/deck/${userId}`}
              className={cn(
                "flex flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-border",
                "w-20 aspect-square transition-all hover:border-primary hover:bg-muted/50"
              )}
            >
              <span className="text-sm font-medium text-muted-foreground">
                +{remainingCount}
              </span>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
