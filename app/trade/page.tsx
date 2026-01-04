"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, ArrowLeftRight, X, Send, Clock, Check, XCircle, Loader2, AlertCircle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CardPreviewPopup } from "@/components/card-preview-popup"
import { TradeDetailModal } from "@/components/trade-detail-modal"
import { TradeCardHoverPreview } from "@/components/trade-card-hover-preview"
import { SearchSuggestions } from "@/components/search-suggestions"
import { TradeCountdown } from "@/components/trade-countdown"
import { useAuth } from "@/contexts/AuthContext"
import { cardsApi, tradesApi, usersApi } from "@/lib/api"
import type { CardDisplay, TradeDisplay } from "@/lib/types"
import { transformTradeForDisplay } from "@/lib/types"

export default function TradePage() {
  const router = useRouter()
  const { user } = useAuth()

  // Data state
  const [userCards, setUserCards] = useState<CardDisplay[]>([])
  const [partnerCards, setPartnerCards] = useState<CardDisplay[]>([])
  const [receivedTrades, setReceivedTrades] = useState<TradeDisplay[]>([])
  const [sentTrades, setSentTrades] = useState<TradeDisplay[]>([])
  const [searchResults, setSearchResults] = useState<Array<{ id: string; username: string; avatar_url?: string }>>([])

  // UI state
  const [searchUsername, setSearchUsername] = useState("")
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [activeTradeUser, setActiveTradeUser] = useState<{ id: string; username: string } | null>(null)
  const [mySelectedCards, setMySelectedCards] = useState<string[]>([])
  const [theirSelectedCards, setTheirSelectedCards] = useState<string[]>([])
  const [hoveredOfferCard, setHoveredOfferCard] = useState<string | null>(null)
  const [offerHoverPosition, setOfferHoverPosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [selectedTradeDetail, setSelectedTradeDetail] = useState<TradeDisplay | null>(null)

  // Loading states
  const [isLoadingTrades, setIsLoadingTrades] = useState(true)
  const [isLoadingUserCards, setIsLoadingUserCards] = useState(true)
  const [isLoadingPartnerCards, setIsLoadingPartnerCards] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSendingTrade, setIsSendingTrade] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  // Fetch user's cards and trades on mount
  useEffect(() => {
    async function fetchData() {
      if (!user) return

      // Fetch user's cards
      const cardsResult = await cardsApi.getUserCards(user.id)
      if (cardsResult.data) {
        setUserCards(cardsResult.data)
      }
      setIsLoadingUserCards(false)

      // Fetch received trades
      const receivedResult = await tradesApi.getReceived()
      if (receivedResult.data) {
        const transformedReceived = receivedResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
        setReceivedTrades(transformedReceived)
      }

      // Fetch sent trades
      const sentResult = await tradesApi.getSent()
      if (sentResult.data) {
        const transformedSent = sentResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
        setSentTrades(transformedSent)
      }
      setIsLoadingTrades(false)
    }

    fetchData()
  }, [user])

  // Debounced user search
  useEffect(() => {
    if (searchUsername.length < 2) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      const result = await usersApi.searchUsers(searchUsername)
      if (result.data) {
        // Filter out current user
        setSearchResults(result.data.filter((u) => u.id !== user?.id))
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchUsername, user])

  // Fetch partner's cards when user selected
  useEffect(() => {
    async function fetchPartnerCards() {
      if (!activeTradeUser) {
        setPartnerCards([])
        return
      }

      setIsLoadingPartnerCards(true)
      const result = await cardsApi.getUserCards(activeTradeUser.id)
      if (result.data) {
        setPartnerCards(result.data)
      } else if (result.error) {
        setError(result.error)
      }
      setIsLoadingPartnerCards(false)
    }

    fetchPartnerCards()
  }, [activeTradeUser])

  const handleSelectUser = (suggestion: any) => {
    setSearchUsername(suggestion.username || suggestion.label)
    setActiveTradeUser({ id: suggestion.id, username: suggestion.username || suggestion.label })
    setMySelectedCards([])
    setTheirSelectedCards([])
    setShowUserSuggestions(false)
  }

  const handleCancelTrade = () => {
    setActiveTradeUser(null)
    setMySelectedCards([])
    setTheirSelectedCards([])
    setPartnerCards([])
  }

  const toggleMyCard = (cardId: string) => {
    if (mySelectedCards.length >= 3 && !mySelectedCards.includes(cardId)) return
    setMySelectedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const toggleTheirCard = (cardId: string) => {
    if (theirSelectedCards.length >= 3 && !theirSelectedCards.includes(cardId)) return
    setTheirSelectedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const refreshTrades = async () => {
    if (!user) return

    const receivedResult = await tradesApi.getReceived()
    if (receivedResult.data) {
      const transformedReceived = receivedResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
      setReceivedTrades(transformedReceived)
    }

    const sentResult = await tradesApi.getSent()
    if (sentResult.data) {
      const transformedSent = sentResult.data.map((trade) => transformTradeForDisplay(trade, user.id))
      setSentTrades(transformedSent)
    }
  }

  const handleSendTrade = async () => {
    if (!user || !activeTradeUser || mySelectedCards.length === 0 || theirSelectedCards.length === 0) return

    setIsSendingTrade(true)
    setError(null)

    const result = await tradesApi.create(activeTradeUser.id, mySelectedCards, theirSelectedCards)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      // Refresh trades list
      await refreshTrades()
      // Reset trade form
      handleCancelTrade()
    }

    setIsSendingTrade(false)
  }

  const handleAcceptTrade = async (tradeId: string) => {
    if (!user) return

    const result = await tradesApi.accept(tradeId)
    if (result.error) {
      setError(result.error)
    } else {
      // Refresh trades and user cards
      await refreshTrades()
      const cardsResult = await cardsApi.getUserCards(user.id)
      if (cardsResult.data) {
        setUserCards(cardsResult.data)
      }
      setSelectedTradeDetail(null)
    }
  }

  const handleDeclineTrade = async (tradeId: string) => {
    if (!user) return

    const result = await tradesApi.decline(tradeId)
    if (result.error) {
      setError(result.error)
    } else {
      // Refresh trades
      await refreshTrades()
      setSelectedTradeDetail(null)
    }
  }

  const handleCardMouseEnter = (e: React.MouseEvent, cardId: string) => {
    setHoveredCard(cardId)
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    })
  }

  const handleOfferCardMouseEnter = (e: React.MouseEvent, cardId: string) => {
    setHoveredOfferCard(cardId)
    const rect = e.currentTarget.getBoundingClientRect()
    setOfferHoverPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2,
    })
  }

  const getHoveredCard = () => {
    if (hoveredCard === null) return null
    const allCards = [...userCards, ...partnerCards]
    return allCards.find((card) => card.id === hoveredCard) || null
  }

  const getHoveredOfferCard = () => {
    if (hoveredOfferCard === null) return null
    // For trade offers, we need to look in the trades data
    return null // We'll handle this differently in the UI
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Side - Trade Offers */}
          <div className="lg:col-span-1 space-y-6">
            {/* Received Trade Offers */}
            <Card className="overflow-hidden border-border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold">Trade Offers</h2>

              {isLoadingTrades ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : receivedTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trade offers received</p>
                  <p className="text-sm mt-2">Offers from others will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedTrades.filter(t => t.status === 'pending' || t.status === 'expired').slice(0, 3).map((trade) => (
                  <Card
                    key={trade.id}
                    onClick={() => setSelectedTradeDetail(trade)}
                    className={cn(
                      "border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-[0_0_20px_rgba(255,92,147,0.3)] cursor-pointer",
                      trade.status === "pending" && "border-l-orange-500",
                      trade.status === "accepted" && "border-l-green-500",
                      (trade.status === "declined" || trade.status === "expired") && "border-l-destructive",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trade.from}</p>
                        <p className="text-xs text-muted-foreground">{trade.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.status === "pending" && (
                          <TradeCountdown expiresAt={trade.expiresAt} className="text-xs text-muted-foreground" />
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                            trade.status === "pending" && "bg-primary/20 text-primary",
                            trade.status === "accepted" && "bg-green-500/20 text-green-500",
                            (trade.status === "declined" || trade.status === "expired") && "bg-destructive/20 text-destructive",
                          )}
                        >
                          {trade.status === "pending" && <Clock className="h-3 w-3" />}
                          {trade.status === "accepted" && <Check className="h-3 w-3" />}
                          {trade.status === "declined" && <XCircle className="h-3 w-3" />}
                          {trade.status === "expired" && <AlertCircle className="h-3 w-3" />}
                          {trade.status}
                        </div>
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
                      <div className="mt-4 text-center text-xs text-muted-foreground">
                        This trade has expired
                      </div>
                    )}
                  </Card>
                  ))}
                </div>
              )}

              {receivedTrades.filter(t => t.status === 'pending' || t.status === 'expired').length > 3 && (
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => router.push("/trade/all-offers")}
                >
                  Show All Trade Offers
                </Button>
              )}
            </Card>

            {/* Sent Trades */}
            <Card className="overflow-hidden border-border bg-card p-6">
              <h2 className="mb-6 text-2xl font-bold">Trades Sent</h2>

              {isLoadingTrades ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sentTrades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No trades sent yet</p>
                  <p className="text-sm mt-2">Your sent trades will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentTrades.slice(0, 3).map((trade) => (
                  <Card
                    key={trade.id}
                    onClick={() => setSelectedTradeDetail(trade)}
                    className={cn(
                      "border-l-4 bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-[0_0_20px_rgba(255,92,147,0.3)] cursor-pointer",
                      trade.status === "pending" && "border-l-blue-500",
                      trade.status === "accepted" && "border-l-green-500",
                      (trade.status === "declined" || trade.status === "expired") && "border-l-destructive",
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">To: {trade.from}</p>
                        <p className="text-xs text-muted-foreground">{trade.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.status === "pending" && (
                          <TradeCountdown expiresAt={trade.expiresAt} className="text-xs text-muted-foreground" />
                        )}
                        <div
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                            trade.status === "pending" && "bg-blue-500/20 text-blue-500",
                            trade.status === "accepted" && "bg-green-500/20 text-green-500",
                            (trade.status === "declined" || trade.status === "expired") && "bg-destructive/20 text-destructive",
                          )}
                        >
                          {trade.status === "pending" && <Clock className="h-3 w-3" />}
                          {trade.status === "accepted" && <Check className="h-3 w-3" />}
                          {trade.status === "declined" && <XCircle className="h-3 w-3" />}
                          {trade.status === "expired" && <AlertCircle className="h-3 w-3" />}
                          {trade.status}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">You offered:</p>
                        <p className="font-medium">
                          {trade.requesting.map((card, index) => (
                            <span key={card.id}>
                              {card.songName}
                              {index < trade.requesting.length - 1 && <span>, </span>}
                            </span>
                          ))}
                        </p>
                      </div>
                      <div className="flex items-center justify-center text-muted-foreground">
                        <ArrowLeftRight className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-muted-foreground">You requested:</p>
                        <p className="font-medium">
                          {trade.offering.map((card, index) => (
                            <span key={card.id}>
                              {card.songName}
                              {index < trade.offering.length - 1 && <span>, </span>}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                    {trade.status === "expired" && (
                      <div className="mt-4 text-center text-xs text-muted-foreground">
                        This trade has expired
                      </div>
                    )}
                  </Card>
                  ))}
                </div>
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
                        onKeyDown={(e) => e.key === "Enter" && searchResults.length > 0 && handleSelectUser(searchResults[0])}
                        onFocus={() => searchUsername.length > 0 && setShowUserSuggestions(true)}
                        className="pl-10 bg-muted/30 border-border"
                      />
                      <SearchSuggestions
                        suggestions={searchResults.map((u) => ({
                          id: u.id,
                          label: u.username,
                          username: u.username,
                        }))}
                        searchQuery={searchUsername}
                        isOpen={showUserSuggestions && searchResults.length > 0}
                        onSelectSuggestion={handleSelectUser}
                        renderSuggestion={(suggestion) => (
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{suggestion.label}</span>
                            {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Trading with {activeTradeUser.username}</h2>
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
                    {isLoadingUserCards ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : userCards.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Your deck is empty</p>
                        <p className="text-xs mt-1">Unbox cards to start trading!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => toggleMyCard(card.id)}
                          onMouseEnter={(e) => handleCardMouseEnter(e, card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={cn(
                            "cursor-pointer rounded-lg border-2 bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-[0_0_15px_rgba(255,92,147,0.25)]",
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
                    )}
                  </div>

                  <div className="hidden items-center justify-center lg:flex">
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <ArrowLeftRight className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  {/* Their Cards */}
                  <div className="lg:col-start-2">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                      {activeTradeUser?.username}'s Cards
                      <span className="rounded-full bg-secondary/20 px-2 py-1 text-xs text-secondary">
                        {theirSelectedCards.length}/3
                      </span>
                    </h3>
                    {isLoadingPartnerCards ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : partnerCards.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">{activeTradeUser?.username} has no cards</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {partnerCards.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => toggleTheirCard(card.id)}
                          onMouseEnter={(e) => handleCardMouseEnter(e, card.id)}
                          onMouseLeave={() => setHoveredCard(null)}
                          className={cn(
                            "cursor-pointer rounded-lg border-2 bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-[0_0_15px_rgba(255,92,147,0.25)]",
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
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                  <Button variant="outline" onClick={handleCancelTrade} className="bg-transparent" disabled={isSendingTrade}>
                    Cancel Trade
                  </Button>
                  <Button
                    onClick={handleSendTrade}
                    disabled={mySelectedCards.length === 0 || theirSelectedCards.length === 0 || isSendingTrade}
                    className="gap-2"
                  >
                    {isSendingTrade ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Trade Offer
                      </>
                    )}
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
          isSent={selectedTradeDetail.isSent}
          onAccept={() => handleAcceptTrade(selectedTradeDetail.id)}
          onDecline={() => handleDeclineTrade(selectedTradeDetail.id)}
        />
      )}
    </div>
  )
}
