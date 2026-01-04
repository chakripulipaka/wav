"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Clock, Check, XCircle, Loader2, AlertCircle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TradeDetailModal } from "@/components/trade-detail-modal"
import { TradeCountdown } from "@/components/trade-countdown"
import { useAuth } from "@/contexts/AuthContext"
import { tradesApi } from "@/lib/api"
import type { TradeDisplay } from "@/lib/types"
import { transformTradeForDisplay } from "@/lib/types"

export default function AllTradeOffersPage() {
  const { user } = useAuth()

  // Data state
  const [trades, setTrades] = useState<TradeDisplay[]>([])
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<TradeDisplay | null>(null)
  const [hoveredOfferCard, setHoveredOfferCard] = useState<string | null>(null)

  // Loading state
  const [isLoading, setIsLoading] = useState(true)

  // Handler for card hover
  const handleOfferCardMouseEnter = (e: React.MouseEvent, cardId: string) => {
    setHoveredOfferCard(cardId)
  }

  // Fetch trades on mount
  useEffect(() => {
    async function fetchTrades() {
      if (!user) return

      const result = await tradesApi.getAll()
      if (result.data) {
        const transformedTrades = result.data.map((trade) => transformTradeForDisplay(trade, user.id))
        setTrades(transformedTrades)
      }
      setIsLoading(false)
    }

    fetchTrades()
  }, [user])

  const handleAcceptTrade = async (tradeId: string) => {
    if (!user) return

    const result = await tradesApi.accept(tradeId)
    if (!result.error) {
      // Refresh trades
      const tradesResult = await tradesApi.getAll()
      if (tradesResult.data) {
        const transformedTrades = tradesResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
        setTrades(transformedTrades)
      }
      setSelectedTradeDetail(null)
    }
  }

  const handleDeclineTrade = async (tradeId: string) => {
    if (!user) return

    const result = await tradesApi.decline(tradeId)
    if (!result.error) {
      // Refresh trades
      const tradesResult = await tradesApi.getAll()
      if (tradesResult.data) {
        const transformedTrades = tradesResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
        setTrades(transformedTrades)
      }
      setSelectedTradeDetail(null)
    }
  }

  // Guest restriction check
  if (user?.is_guest) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <Lock className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Trading Unavailable</h1>
            <p className="text-muted-foreground">
              Guest accounts cannot trade cards. Create a full account to unlock trading!
            </p>
          </div>
          <Link href="/login?mode=signup">
            <Button className="bg-primary hover:bg-primary/90">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-8 text-3xl font-bold">All Trade Offers</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : trades.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No trade offers yet</p>
            <p className="text-sm text-muted-foreground mt-2">Visit the trade page to start trading!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
            <Card
              key={trade.id}
              onClick={() => setSelectedTradeDetail(trade)}
              className={cn(
                "border-l-4 bg-muted/30 p-6 transition-all hover:bg-muted/50 hover:shadow-[0_0_20px_rgba(255,92,147,0.3)] cursor-pointer",
                trade.status === "pending" && !trade.isSent && "border-l-orange-500",
                trade.status === "pending" && trade.isSent && "border-l-blue-500",
                trade.status === "accepted" && "border-l-green-500",
                (trade.status === "declined" || trade.status === "expired") && "border-l-destructive",
              )}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{trade.isSent ? `To: ${trade.from}` : trade.from}</p>
                  <p className="text-sm text-muted-foreground">{trade.timestamp}</p>
                </div>
                <div className="flex items-center gap-2">
                  {trade.status === "pending" && (
                    <TradeCountdown expiresAt={trade.expiresAt} className="text-sm text-muted-foreground" />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                      trade.status === "pending" && !trade.isSent && "bg-primary/20 text-primary",
                      trade.status === "pending" && trade.isSent && "bg-blue-500/20 text-blue-500",
                      trade.status === "accepted" && "bg-green-500/20 text-green-500",
                      (trade.status === "declined" || trade.status === "expired") && "bg-destructive/20 text-destructive",
                    )}
                  >
                    {trade.status === "pending" && <Clock className="h-4 w-4" />}
                    {trade.status === "accepted" && <Check className="h-4 w-4" />}
                    {trade.status === "declined" && <XCircle className="h-4 w-4" />}
                    {trade.status === "expired" && <AlertCircle className="h-4 w-4" />}
                    {trade.status}
                  </div>
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

              {trade.status === "pending" && !trade.isSent && (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAcceptTrade(trade.id)
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
                      handleDeclineTrade(trade.id)
                    }}
                  >
                    Decline
                  </Button>
                </div>
              )}
              {trade.status === "expired" && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  This trade has expired
                </div>
              )}
            </Card>
            ))}
          </div>
        )}
      </div>

      {selectedTradeDetail && (
        <TradeDetailModal
          open={!!selectedTradeDetail}
          onOpenChange={(open) => !open && setSelectedTradeDetail(null)}
          trade={selectedTradeDetail}
          isSent={selectedTradeDetail.isSent}
          onAccept={() => handleAcceptTrade(selectedTradeDetail.id)}
          onDecline={() => handleDeclineTrade(selectedTradeDetail.id)}
        />
      )}
    </div>
  )
}
