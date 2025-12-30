"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TradeCardCompact } from "@/components/trade-card-compact"

interface TradeDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade: {
    id: number | string
    from: string
    status: "pending" | "accepted" | "declined" | "expired"
    timestamp: string
    expiresAt?: string
    isSent?: boolean
    offering: Array<{
      id: number | string
      songName: string
      artistName: string
      albumArtUrl?: string
      momentum: number
      energy: number
    }>
    requesting: Array<{
      id: number | string
      songName: string
      artistName: string
      albumArtUrl?: string
      momentum: number
      energy: number
    }>
  }
  isSent?: boolean // Whether current user sent this trade
  onAccept?: () => void
  onDecline?: () => void
}

export function TradeDetailModal({ open, onOpenChange, trade, isSent, onAccept, onDecline }: TradeDetailModalProps) {
  // Determine if this is a sent trade (from prop or trade.isSent)
  const isTradeFromCurrentUser = isSent ?? trade.isSent ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {isTradeFromCurrentUser ? `Trade sent to ${trade.from}` : `Trade Details with ${trade.from}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between px-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-base font-semibold capitalize mt-1">{trade.status}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="text-base font-semibold">{trade.timestamp}</p>
            </div>
          </div>

          <div className="px-4">
            <div className="flex flex-col items-center gap-6">
              <div className="w-full">
                <h3 className="mb-3 text-sm font-semibold">They're Offering</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {trade.offering.map((card) => (
                    <TradeCardCompact key={card.id} card={card} />
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="w-full">
                <h3 className="mb-3 text-sm font-semibold">They're Requesting</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {trade.requesting.map((card) => (
                    <TradeCardCompact key={card.id} card={card} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {trade.status === "pending" && !isTradeFromCurrentUser && (
            <div className="flex gap-3 border-t border-border pt-4 px-4">
              <Button onClick={onAccept} className="flex-1">
                Accept
              </Button>
              <Button onClick={onDecline} variant="outline" className="flex-1 bg-transparent">
                Decline
              </Button>
            </div>
          )}

          {trade.status === "expired" && (
            <div className="border-t border-border pt-4 px-4 text-center text-muted-foreground">
              <p>This trade has expired</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
