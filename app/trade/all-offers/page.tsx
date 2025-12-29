"use client"

import type React from "react"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Clock, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { TradeDetailModal } from "@/components/trade-detail-modal"
import { TradeCardHoverPreview } from "@/components/trade-card-hover-preview"

const mockUserCards = [
  {
    id: 1,
    songName: "Blinding Lights",
    artistName: "The Weeknd",
    albumArtUrl: "/blinding-lights.jpg",
    momentum: 98,
    energy: 450,
  },
  {
    id: 2,
    songName: "As It Was",
    artistName: "Harry Styles",
    albumArtUrl: "/as-it-was.jpg",
    momentum: 95,
    energy: 420,
  },
  {
    id: 3,
    songName: "Heat Waves",
    artistName: "Glass Animals",
    albumArtUrl: "/heat-waves.jpg",
    momentum: 92,
    energy: 380,
  },
]

const mockOtherUserCards = [
  {
    id: 4,
    songName: "Shivers",
    artistName: "Ed Sheeran",
    albumArtUrl: "/shivers.jpg",
    momentum: 89,
    energy: 350,
  },
  {
    id: 5,
    songName: "Stay",
    artistName: "The Kid LAROI",
    albumArtUrl: "/stay-kid-laroi.jpg",
    momentum: 87,
    energy: 340,
  },
  {
    id: 6,
    songName: "Easy On Me",
    artistName: "Adele",
    albumArtUrl: "/easy-on-me.jpg",
    momentum: 85,
    energy: 330,
  },
]

const mockTrades = [
  {
    id: 1,
    from: "MusicMaestro",
    status: "pending" as const,
    timestamp: "2 minutes ago",
    offering: [mockOtherUserCards[0], mockOtherUserCards[1]],
    requesting: [mockUserCards[0], mockUserCards[2]],
  },
  {
    id: 2,
    from: "BeatCollector",
    status: "accepted" as const,
    timestamp: "1 hour ago",
    offering: [mockOtherUserCards[1]],
    requesting: [mockUserCards[1]],
  },
  {
    id: 3,
    from: "SoundWave",
    status: "declined" as const,
    timestamp: "3 hours ago",
    offering: [mockOtherUserCards[2], mockOtherUserCards[0]],
    requesting: [mockUserCards[2], mockUserCards[1]],
  },
  {
    id: 4,
    from: "RhythmKing",
    status: "pending" as const,
    timestamp: "5 hours ago",
    offering: [mockOtherUserCards[0]],
    requesting: [mockUserCards[1]],
  },
  {
    id: 5,
    from: "SonicVibes",
    status: "accepted" as const,
    timestamp: "6 hours ago",
    offering: [mockOtherUserCards[1], mockOtherUserCards[2]],
    requesting: [mockUserCards[2]],
  },
  {
    id: 6,
    from: "MelodyHunter",
    status: "pending" as const,
    timestamp: "8 hours ago",
    offering: [mockOtherUserCards[2]],
    requesting: [mockUserCards[0], mockUserCards[1]],
  },
]

export default function AllTradeOffersPage() {
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<(typeof mockTrades)[0] | null>(null)
  const [hoveredOfferCard, setHoveredOfferCard] = useState<number | null>(null)
  const [offerHoverPosition, setOfferHoverPosition] = useState({ x: 0, y: 0 })

  const handleOfferCardMouseEnter = (e: React.MouseEvent, cardId: number) => {
    setHoveredOfferCard(cardId)
    const rect = e.currentTarget.getBoundingClientRect()
    setOfferHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    })
  }

  const getHoveredOfferCard = () => {
    if (hoveredOfferCard === null) return null
    const allCards = [...mockUserCards, ...mockOtherUserCards]
    return allCards.find((card) => card.id === hoveredOfferCard) || null
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-8 text-3xl font-bold">All Trade Offers</h1>

        <div className="space-y-4">
          {mockTrades.map((trade) => (
            <Card
              key={trade.id}
              onClick={() => setSelectedTradeDetail(trade)}
              className={cn(
                "border-l-4 bg-muted/30 p-6 transition-all hover:bg-muted/50 cursor-pointer",
                trade.status === "pending" && "border-l-orange-500",
                trade.status === "accepted" && "border-l-green-500",
                trade.status === "declined" && "border-l-destructive",
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{trade.from}</p>
                  <p className="text-sm text-muted-foreground">{trade.timestamp}</p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                    trade.status === "pending" && "bg-primary/20 text-primary",
                    trade.status === "accepted" && "bg-green-500/20 text-green-500",
                    trade.status === "declined" && "bg-destructive/20 text-destructive",
                  )}
                >
                  {trade.status === "pending" && <Clock className="h-4 w-4" />}
                  {trade.status === "accepted" && <Check className="h-4 w-4" />}
                  {trade.status === "declined" && <XCircle className="h-4 w-4" />}
                  {trade.status}
                </div>
              </div>

              <div className="space-y-3 text-base">
                <div>
                  <p className="text-muted-foreground">Offering:</p>
                  <p className="font-medium">
                    {trade.offering.map((card, index) => (
                      <span key={card.id}>
                        <span
                          className="cursor-pointer transition-colors"
                          onMouseEnter={(e) => {
                            e.stopPropagation()
                            handleOfferCardMouseEnter(e, card.id)
                          }}
                          onMouseLeave={() => setHoveredOfferCard(null)}
                        >
                          {hoveredOfferCard === card.id ? (
                            <span className="text-secondary">{card.songName}</span>
                          ) : (
                            card.songName
                          )}
                        </span>
                        {index < trade.offering.length - 1 && <span>, </span>}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-muted-foreground">Requesting:</p>
                  <p className="font-medium">
                    {trade.requesting.map((card, index) => (
                      <span key={card.id}>
                        <span
                          className="cursor-pointer transition-colors"
                          onMouseEnter={(e) => {
                            e.stopPropagation()
                            handleOfferCardMouseEnter(e, card.id)
                          }}
                          onMouseLeave={() => setHoveredOfferCard(null)}
                        >
                          {hoveredOfferCard === card.id ? (
                            <span className="text-secondary">{card.songName}</span>
                          ) : (
                            card.songName
                          )}
                        </span>
                        {index < trade.requesting.length - 1 && <span>, </span>}
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {trade.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Accepted trade:", trade.id)
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log("[v0] Declined trade:", trade.id)
                    }}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {hoveredOfferCard && getHoveredOfferCard() && (
        <TradeCardHoverPreview card={getHoveredOfferCard()!} position={offerHoverPosition} />
      )}

      {selectedTradeDetail && (
        <TradeDetailModal
          open={!!selectedTradeDetail}
          onOpenChange={(open) => !open && setSelectedTradeDetail(null)}
          trade={selectedTradeDetail}
          onAccept={() => {
            console.log("[v0] Accept trade:", selectedTradeDetail.id)
            setSelectedTradeDetail(null)
          }}
          onDecline={() => {
            console.log("[v0] Decline trade:", selectedTradeDetail.id)
            setSelectedTradeDetail(null)
          }}
        />
      )}
    </div>
  )
}
