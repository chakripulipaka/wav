"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ArrowLeftRight, X, Send, Clock, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardPreviewPopup } from "@/components/card-preview-popup"
import { TradeDetailModal } from "@/components/trade-detail-modal"
import { TradeCardHoverPreview } from "@/components/trade-card-hover-preview"
import { SearchSuggestions } from "@/components/search-suggestions"

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
]

const mockTradeUsers = [
  { id: "user1", username: "MusicMaestro" },
  { id: "user2", username: "BeatCollector" },
  { id: "user3", username: "SoundWave" },
  { id: "user4", username: "RhythmKing" },
  { id: "user5", username: "EchoVibe" },
  { id: "user6", username: "MelodyHunter" },
]

export default function TradePage() {
  const router = useRouter()
  const [searchUsername, setSearchUsername] = useState("")
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [activeTradeUser, setActiveTradeUser] = useState<string | null>(null)
  const [mySelectedCards, setMySelectedCards] = useState<number[]>([])
  const [theirSelectedCards, setTheirSelectedCards] = useState<number[]>([])
  const [hoveredOfferCard, setHoveredOfferCard] = useState<number | null>(null)
  const [offerHoverPosition, setOfferHoverPosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<(typeof mockTrades)[0] | null>(null)

  const handleStartTrade = () => {
    if (searchUsername.trim()) {
      setActiveTradeUser(searchUsername)
      setMySelectedCards([])
      setTheirSelectedCards([])
      setShowUserSuggestions(false)
    }
  }

  const handleSelectUser = (suggestion: any) => {
    setSearchUsername(suggestion.username)
    setActiveTradeUser(suggestion.username)
    setMySelectedCards([])
    setTheirSelectedCards([])
    setShowUserSuggestions(false)
  }

  const handleCancelTrade = () => {
    setActiveTradeUser(null)
    setMySelectedCards([])
    setTheirSelectedCards([])
  }

  const toggleMyCard = (cardId: number) => {
    if (mySelectedCards.length >= 3 && !mySelectedCards.includes(cardId)) return
    setMySelectedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const toggleTheirCard = (cardId: number) => {
    if (theirSelectedCards.length >= 3 && !theirSelectedCards.includes(cardId)) return
    setTheirSelectedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const handleSendTrade = () => {
    console.log("[v0] Trade sent:", { myCards: mySelectedCards, theirCards: theirSelectedCards })
    alert("Trade offer sent!")
    handleCancelTrade()
  }

  const handleCardMouseEnter = (e: React.MouseEvent, cardId: number) => {
    setHoveredCard(cardId)
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    })
  }

  const handleOfferCardMouseEnter = (e: React.MouseEvent, cardId: number) => {
    setHoveredOfferCard(cardId)
    const rect = e.currentTarget.getBoundingClientRect()
    setOfferHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    })
  }

  const getHoveredCard = () => {
    if (hoveredCard === null) return null
    const allCards = [...mockUserCards, ...mockOtherUserCards]
    return allCards.find((card) => card.id === hoveredCard) || null
  }

  const getHoveredOfferCard = () => {
    if (hoveredOfferCard === null) return null
    const allCards = [...mockUserCards, ...mockOtherUserCards]
    return allCards.find((card) => card.id === hoveredOfferCard) || null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Side - Trade Offers */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden border-border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold">Trade Offers</h2>

              <div className="space-y-4">
                {mockTrades.slice(0, 3).map((trade) => (
                  <Card
                    key={trade.id}
                    onClick={() => setSelectedTradeDetail(trade)}
                    className={cn(
                      "border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 cursor-pointer",
                      trade.status === "pending" && "border-l-orange-500",
                      trade.status === "accepted" && "border-l-green-500",
                      trade.status === "declined" && "border-l-destructive",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trade.from}</p>
                        <p className="text-xs text-muted-foreground">{trade.timestamp}</p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                          trade.status === "pending" && "bg-primary/20 text-primary",
                          trade.status === "accepted" && "bg-green-500/20 text-green-500",
                          trade.status === "declined" && "bg-destructive/20 text-destructive",
                        )}
                      >
                        {trade.status === "pending" && <Clock className="h-3 w-3" />}
                        {trade.status === "accepted" && <Check className="h-3 w-3" />}
                        {trade.status === "declined" && <XCircle className="h-3 w-3" />}
                        {trade.status}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
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
                        <ArrowLeftRight className="h-4 w-4" />
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
                            console.log("[v0] Accepted trade from card:", trade.id)
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
                            console.log("[v0] Declined trade from card:", trade.id)
                          }}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {mockTrades.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => router.push("/trade/all-offers")}
                >
                  Show All Trade Offers
                </Button>
              )}
            </Card>
          </div>

          {/* Right Side - Trading Interface */}
          <div className="lg:col-span-2">
            {!activeTradeUser ? (
              <Card className="border-border bg-card p-8">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <ArrowLeftRight className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="mb-4 text-3xl font-bold">Start a New Trade</h2>
                  <p className="mb-8 text-muted-foreground">Search for a user to begin trading cards</p>

                  <div className="flex w-full max-w-md gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Enter username..."
                        value={searchUsername}
                        onChange={(e) => {
                          setSearchUsername(e.target.value)
                          setShowUserSuggestions(e.target.value.length > 0)
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleStartTrade()}
                        onFocus={() => searchUsername.length > 0 && setShowUserSuggestions(true)}
                        className="pl-10 bg-muted/30 border-border"
                      />
                      <SearchSuggestions
                        suggestions={mockTradeUsers.map((u) => ({
                          id: u.id,
                          label: u.username,
                          username: u.username,
                        }))}
                        searchQuery={searchUsername}
                        isOpen={showUserSuggestions}
                        onSelectSuggestion={handleSelectUser}
                        renderSuggestion={(suggestion) => (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{suggestion.label}</span>
                          </div>
                        )}
                      />
                    </div>
                    <Button onClick={handleStartTrade} disabled={!searchUsername.trim()}>
                      Start Trade
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Trading with {activeTradeUser}</h2>
                    <p className="text-sm text-muted-foreground">Select up to 3 cards from each side</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCancelTrade}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Your Cards */}
                  <div>
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      Your Cards
                      <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                        {mySelectedCards.length}/3
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {mockUserCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => toggleMyCard(card.id)}
                          onMouseEnter={(e) => handleCardMouseEnter(e, card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={cn(
                            "cursor-pointer rounded-lg border-2 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                            mySelectedCards.includes(card.id) ? "border-primary bg-primary/10" : "border-transparent",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={card.albumArtUrl || "/placeholder.svg"}
                              alt={card.songName}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className={cn("font-semibold", hoveredCard === card.id && "text-secondary")}>
                                {card.songName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{card.artistName}</p>
                              <div className="mt-1 flex gap-3 text-xs">
                                <span className="text-primary">M: {card.momentum}</span>
                                <span className="text-secondary">E: {card.energy}</span>
                              </div>
                            </div>
                            {mySelectedCards.includes(card.id) && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hidden items-center justify-center lg:flex">
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <ArrowLeftRight className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  {/* Their Cards */}
                  <div className="lg:col-start-2">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      {activeTradeUser}'s Cards
                      <span className="rounded-full bg-secondary/20 px-2 py-1 text-xs text-secondary">
                        {theirSelectedCards.length}/3
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {mockOtherUserCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => toggleTheirCard(card.id)}
                          onMouseEnter={(e) => handleCardMouseEnter(e, card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={cn(
                            "cursor-pointer rounded-lg border-2 bg-muted/30 p-4 transition-all hover:bg-muted/50",
                            theirSelectedCards.includes(card.id)
                              ? "border-secondary bg-secondary/10"
                              : "border-transparent",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={card.albumArtUrl || "/placeholder.svg"}
                              alt={card.songName}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <h4 className={cn("font-semibold", hoveredCard === card.id && "text-secondary")}>
                                {card.songName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{card.artistName}</p>
                              <div className="mt-1 flex gap-3 text-xs">
                                <span className="text-primary">M: {card.momentum}</span>
                                <span className="text-secondary">E: {card.energy}</span>
                              </div>
                            </div>
                            {theirSelectedCards.includes(card.id) && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                  <Button variant="outline" onClick={handleCancelTrade} className="bg-transparent">
                    Cancel Trade
                  </Button>
                  <Button
                    onClick={handleSendTrade}
                    disabled={mySelectedCards.length === 0 || theirSelectedCards.length === 0}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Trade Offer
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {hoveredOfferCard && getHoveredOfferCard() && (
        <TradeCardHoverPreview card={getHoveredOfferCard()!} position={offerHoverPosition} />
      )}

      {hoveredCard && getHoveredCard() && <CardPreviewPopup card={getHoveredCard()!} position={hoverPosition} />}

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
