"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Music2, Zap, TrendingUp, Lock, Loader2, ArrowLeftRight } from "lucide-react"
import { MusicCard } from "@/components/music-card"
import { SearchSuggestions } from "@/components/search-suggestions"
import { AnalyticsChart } from "@/components/analytics-chart"
import { DeckPreview } from "@/components/deck-preview"
import { usersApi, cardsApi, analyticsApi } from "@/lib/api"
import type { LeaderboardEntry, Card as CardType, UserAnalytics, HistoricalDataPoint, CardDisplay } from "@/lib/types"

interface TopCard extends CardType {
  num_owned: number
}

interface SelectedUser {
  id: string
  username: string
  total_energy: number
  cards_collected: number
  avatar_url?: string
}

interface SelectedCard {
  id: string
  songName: string
  artistName: string
  albumArtUrl: string
  momentum: number
  energy: number
  numOwned: number
  bpm?: number
  genre?: string
}

export default function AnalyticsPage() {
  // Separate search state for users and cards
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [cardSearchQuery, setCardSearchQuery] = useState("")
  const [showCardSuggestions, setShowCardSuggestions] = useState(false)

  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null)
  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)
  const [timeScale, setTimeScale] = useState<"day" | "week" | "month">("month")

  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([])
  const [topCards, setTopCards] = useState<TopCard[]>([])
  const [loading, setLoading] = useState(true)

  // User analytics state
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null)
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([])
  const [userCards, setUserCards] = useState<CardDisplay[]>([])
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [deckIsPrivate, setDeckIsPrivate] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const [usersResult, cardsResult] = await Promise.all([
        usersApi.getLeaderboard(),
        cardsApi.getTopCards(10)
      ])

      if (usersResult.data) {
        setTopUsers(usersResult.data)
      }

      if (cardsResult.data) {
        setTopCards(cardsResult.data)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  // Fetch user analytics, history, and cards when a user is selected or time scale changes
  useEffect(() => {
    async function fetchUserData() {
      if (!selectedUser) return

      setLoadingUserData(true)
      setDeckIsPrivate(false)

      // Fetch all data in parallel
      const [analyticsResult, historyResult, cardsResult] = await Promise.all([
        analyticsApi.getUserAnalytics(selectedUser.id),
        analyticsApi.getHistory(selectedUser.id, timeScale),
        cardsApi.getUserCards(selectedUser.id)
      ])

      if (analyticsResult.data) {
        setUserAnalytics(analyticsResult.data)
      }

      if (historyResult.data) {
        setHistoryData(historyResult.data.data)
      } else if (historyResult.error?.includes("private")) {
        setHistoryData([])
      }

      if (cardsResult.data) {
        setUserCards(cardsResult.data)
      } else if (cardsResult.error === "This deck is private") {
        setUserCards([])
        setDeckIsPrivate(true)
      }

      setLoadingUserData(false)
    }

    fetchUserData()
  }, [selectedUser, timeScale])

  const handleUserSearch = () => {
    if (userSearchQuery) {
      const user = topUsers.find((u) => u.username.toLowerCase().includes(userSearchQuery.toLowerCase()))
      if (user) {
        setSelectedUser({
          id: user.id,
          username: user.username,
          total_energy: user.total_energy,
          cards_collected: user.cards_collected,
          avatar_url: user.avatar_url
        })
        setSelectedCard(null)
        setShowUserSuggestions(false)
      }
    }
  }

  const handleCardSearch = () => {
    if (cardSearchQuery) {
      const card = topCards.find((c) => c.song_name.toLowerCase().includes(cardSearchQuery.toLowerCase()))
      if (card) {
        setSelectedCard({
          id: card.id,
          songName: card.song_name,
          artistName: card.artist_name,
          albumArtUrl: card.album_art_url,
          momentum: card.momentum,
          energy: card.energy,
          numOwned: card.num_owned,
          bpm: card.bpm,
          genre: card.genre
        })
        setSelectedUser(null)
        setShowCardSuggestions(false)
      }
    }
  }

  const handleSelectUserSuggestion = (suggestion: any) => {
    setUserSearchQuery(suggestion.username)
    setSelectedUser({
      id: suggestion.id,
      username: suggestion.username,
      total_energy: suggestion.total_energy,
      cards_collected: suggestion.cards_collected,
      avatar_url: suggestion.avatar_url
    })
    setSelectedCard(null)
    setShowUserSuggestions(false)
  }

  const handleSelectCardSuggestion = (suggestion: any) => {
    setCardSearchQuery(suggestion.song_name)
    setSelectedCard({
      id: suggestion.id,
      songName: suggestion.song_name,
      artistName: suggestion.artist_name,
      albumArtUrl: suggestion.album_art_url,
      momentum: suggestion.momentum,
      energy: suggestion.energy,
      numOwned: suggestion.num_owned,
      bpm: suggestion.bpm,
      genre: suggestion.genre
    })
    setSelectedUser(null)
    setShowCardSuggestions(false)
  }

  // Get label for the current time scale
  const getTimeScaleLabel = () => {
    if (timeScale === "day") return "1 Day"
    if (timeScale === "week") return "7 Days"
    return "30 Days"
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : selectedUser ? (
          /* User Profile View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">{selectedUser.username}</h1>
                <p className="mt-2 text-muted-foreground">Portfolio Analytics</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null)
                  setUserAnalytics(null)
                  setHistoryData([])
                  setUserCards([])
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Search
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Energy</p>
                    <p className="text-2xl font-bold text-primary">
                      {(userAnalytics?.totalEnergy ?? selectedUser.total_energy).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Momentum</p>
                    <p className="text-2xl font-bold text-secondary">
                      {(userAnalytics?.totalMomentum ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                    <Music2 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cards</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {userAnalytics?.totalCards ?? selectedUser.cards_collected}
                    </p>
                  </div>
                </div>
              </Card>

            </div>

            {/* Time Scale Controls */}
            <div className="flex gap-2">
              {(["day", "week", "month"] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => setTimeScale(scale)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeScale === scale
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {scale === "day" ? "1 Day" : scale === "week" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>

            {/* Chart or Day Summary */}
            <Card className="border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold">
                {timeScale === "day" ? "Current Stats" : `Energy & Momentum - ${getTimeScaleLabel()}`}
              </h3>

              {loadingUserData ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : timeScale === "day" ? (
                /* Day View - Summary Stats */
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Energy</p>
                    <p className="text-3xl font-bold text-primary">
                      {historyData[0]?.energy?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Momentum</p>
                    <p className="text-3xl font-bold text-secondary">
                      {historyData[0]?.momentum?.toLocaleString() ?? 0}
                    </p>
                  </div>
                </div>
              ) : historyData.length > 0 ? (
                <AnalyticsChart data={historyData} timeScale={timeScale} />
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No historical data available yet. Check back tomorrow!
                </p>
              )}
            </Card>

            {/* Deck Preview */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Deck Preview</h3>
              <DeckPreview
                cards={userCards}
                userId={selectedUser.id}
                username={selectedUser.username}
                isPrivate={deckIsPrivate}
                isOwner={userAnalytics?.isOwner ?? false}
              />
            </div>

            {/* Recent Trades */}
            <div>
              <h3 className="mb-3 text-lg font-semibold">Recent Trades</h3>
              {loadingUserData ? (
                <Card className="p-6">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                </Card>
              ) : userAnalytics?.tradePrivacy === "private" && !userAnalytics?.isOwner ? (
                <Card className="p-6">
                  <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                    <Lock className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-muted-foreground">
                        {selectedUser.username}&apos;s trades are private
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        Only {selectedUser.username} can view their trade history
                      </p>
                    </div>
                  </div>
                </Card>
              ) : userAnalytics?.recentTrades && userAnalytics.recentTrades.filter(t => t.status === 'accepted').length > 0 ? (
                <div className="space-y-4">
                  {userAnalytics.recentTrades.filter(t => t.status === 'accepted').slice(0, 5).map((trade) => {
                    const isSender = trade.sender_id === selectedUser.id
                    const otherUser = isSender ? trade.receiver : trade.sender
                    const userCards = isSender ? trade.sender_cards : trade.receiver_cards
                    const otherCards = isSender ? trade.receiver_cards : trade.sender_cards

                    // Get first card from each side for display
                    const userCard = userCards?.[0]?.card
                    const otherCard = otherCards?.[0]?.card

                    // Calculate relative time
                    const createdDate = new Date(trade.created_at)
                    const now = new Date()
                    const diffMs = now.getTime() - createdDate.getTime()
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                    const diffDays = Math.floor(diffHours / 24)

                    let timeAgo: string
                    if (diffHours < 1) {
                      timeAgo = "Just now"
                    } else if (diffHours < 24) {
                      timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
                    } else {
                      timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
                    }

                    return (
                      <Card key={trade.id} className="p-6 bg-card/50 border-border">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold">
                            Traded with {otherUser?.username ?? "Unknown"}
                          </h4>
                          <p className="text-sm text-muted-foreground">{timeAgo}</p>
                        </div>

                        <div className="flex items-center justify-center gap-6">
                          {/* User's card */}
                          {userCard ? (
                            <div className="flex flex-col items-center">
                              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border mb-3">
                                <img
                                  src={userCard.album_art_url}
                                  alt={userCard.song_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm">{userCard.song_name}</p>
                                <p className="text-sm text-muted-foreground">{userCard.artist_name}</p>
                              </div>
                            </div>
                          ) : null}

                          {/* Swap icon */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                              <ArrowLeftRight className="h-6 w-6 text-primary" />
                            </div>
                          </div>

                          {/* Other user's card */}
                          {otherCard ? (
                            <div className="flex flex-col items-center">
                              <div className="w-48 h-48 rounded-lg overflow-hidden border border-border mb-3">
                                <img
                                  src={otherCard.album_art_url}
                                  alt={otherCard.song_name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-center">
                                <p className="font-semibold text-sm">{otherCard.song_name}</p>
                                <p className="text-sm text-muted-foreground">{otherCard.artist_name}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center py-4">
                    No recent trades.
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : selectedCard ? (
          /* Card Stats View */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">{selectedCard.songName}</h1>
                <p className="mt-2 text-muted-foreground">by {selectedCard.artistName}</p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Search
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-bold">Card Preview</h2>
                <div className="w-full max-w-sm">
                  <MusicCard card={selectedCard} showDelete={false} />
                </div>
              </div>

              <div className="space-y-6">
                <Card className="border-border bg-card p-6">
                  <h3 className="mb-4 text-xl font-bold">Card Stats</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Energy</p>
                      <p className="text-3xl font-bold text-primary">{selectedCard.energy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Momentum</p>
                      <p className="text-3xl font-bold text-secondary">{selectedCard.momentum}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owned By</p>
                      <p className="text-3xl font-bold">{selectedCard.numOwned.toLocaleString()}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* Split-Screen Search View */
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Side - User Search */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Top Users
              </h2>

              {/* User search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for a user..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value)
                    setShowUserSuggestions(e.target.value.length > 0)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUserSearch()}
                  onFocus={() => userSearchQuery.length > 0 && setShowUserSuggestions(true)}
                  className="pl-10 bg-card border-border"
                />
                {topUsers.length > 0 && (
                  <SearchSuggestions
                    suggestions={topUsers.map((u) => ({
                      ...u,
                      label: u.username,
                      sublabel: `${u.cards_collected} cards • ${u.total_energy} energy`,
                    }))}
                    searchQuery={userSearchQuery}
                    isOpen={showUserSuggestions}
                    onSelectSuggestion={handleSelectUserSuggestion}
                  />
                )}
              </div>

              {/* Top users list */}
              {topUsers.length > 0 ? (
                <div className="grid gap-3">
                  {topUsers.map((user, index) => (
                    <Card
                      key={user.id}
                      onClick={() => {
                        setSelectedUser({
                          id: user.id,
                          username: user.username,
                          total_energy: user.total_energy,
                          cards_collected: user.cards_collected,
                          avatar_url: user.avatar_url
                        })
                      }}
                      className="cursor-pointer border-border bg-card p-4 transition-all hover:border-primary hover:bg-card/80"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-black text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="font-bold">{user.username}</h3>
                            <p className="text-xs text-muted-foreground">{user.cards_collected} cards</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Energy</p>
                          <p className="font-bold text-primary">{user.total_energy.toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found.</p>
                </div>
              )}
            </div>

            {/* Right Side - Card Search */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">
                Top Cards
              </h2>

              {/* Card search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for a card..."
                  value={cardSearchQuery}
                  onChange={(e) => {
                    setCardSearchQuery(e.target.value)
                    setShowCardSuggestions(e.target.value.length > 0)
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCardSearch()}
                  onFocus={() => cardSearchQuery.length > 0 && setShowCardSuggestions(true)}
                  className="pl-10 bg-card border-border"
                />
                {topCards.length > 0 && (
                  <SearchSuggestions
                    suggestions={topCards.map((c) => ({
                      ...c,
                      label: c.song_name,
                      sublabel: `${c.artist_name} • ${c.momentum} momentum`,
                    }))}
                    searchQuery={cardSearchQuery}
                    isOpen={showCardSuggestions}
                    onSelectSuggestion={handleSelectCardSuggestion}
                  />
                )}
              </div>

              {/* Top cards list */}
              {topCards.length > 0 ? (
                <div className="grid gap-3">
                  {topCards.map((card, index) => (
                    <Card
                      key={card.id}
                      onClick={() => setSelectedCard({
                        id: card.id,
                        songName: card.song_name,
                        artistName: card.artist_name,
                        albumArtUrl: card.album_art_url,
                        momentum: card.momentum,
                        energy: card.energy,
                        numOwned: card.num_owned,
                        bpm: card.bpm,
                        genre: card.genre
                      })}
                      className="cursor-pointer border-border bg-card p-4 transition-all hover:border-primary hover:bg-card/80"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-black text-sm">
                            #{index + 1}
                          </div>
                          <div>
                            <h3 className="font-bold">{card.song_name}</h3>
                            <p className="text-xs text-muted-foreground">{card.artist_name}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-xs text-muted-foreground">Momentum</p>
                            <p className="font-bold text-primary">{card.momentum}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Owned By</p>
                            <p className="font-bold text-secondary">{card.num_owned}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cards found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
