"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, TrendingUp, User, Music2, Zap, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartTooltip } from "@/components/ui/chart"
import { TradeCardDisplay } from "@/components/trade-card-display"
import { MusicCard } from "@/components/music-card"
import { SearchSuggestions } from "@/components/search-suggestions"

const energyOverTimeData = [
  { date: "Jan", energy: 3200 },
  { date: "Feb", energy: 3800 },
  { date: "Mar", energy: 4200 },
  { date: "Apr", energy: 4600 },
  { date: "May", energy: 5100 },
  { date: "Jun", energy: 5400 },
]

const momentumOverTimeData = [
  { date: "Jan", momentum: 72 },
  { date: "Feb", momentum: 76 },
  { date: "Mar", momentum: 79 },
  { date: "Apr", momentum: 82 },
  { date: "May", momentum: 85 },
  { date: "Jun", momentum: 88 },
]

const mockUsers = [
  { username: "MusicMaestro", energy: 12450, cards: 145, avgMomentum: 85 },
  { username: "BeatCollector", energy: 11890, cards: 132, avgMomentum: 83 },
  { username: "SoundWave", energy: 11230, cards: 128, avgMomentum: 81 },
]

const mockCards = [
  {
    id: 1,
    songName: "Blinding Lights",
    artistName: "The Weeknd",
    albumArtUrl: "/blinding-lights.jpg",
    momentum: 98,
    energy: 450,
    numOwned: 1250,
  },
  {
    id: 2,
    songName: "As It Was",
    artistName: "Harry Styles",
    albumArtUrl: "/as-it-was.jpg",
    momentum: 95,
    energy: 420,
    numOwned: 1180,
  },
  {
    id: 3,
    songName: "Heat Waves",
    artistName: "Glass Animals",
    albumArtUrl: "/heat-waves.jpg",
    momentum: 92,
    energy: 380,
    numOwned: 1090,
  },
]

export default function AnalyticsPage() {
  const [searchType, setSearchType] = useState<"users" | "cards">("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedUser, setSelectedUser] = useState<(typeof mockUsers)[0] | null>(null)
  const [selectedCard, setSelectedCard] = useState<(typeof mockCards)[0] | null>(null)
  const [timeScale, setTimeScale] = useState<"day" | "week" | "month">("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    console.log("[v0] selectedUser state changed:", selectedUser)
  }, [selectedUser])

  const handleSearch = () => {
    if (searchType === "users" && searchQuery) {
      const user = mockUsers.find((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      if (user) {
        setSelectedUser(user)
        setSelectedCard(null)
        setShowSuggestions(false)
      }
    } else if (searchType === "cards" && searchQuery) {
      const card = mockCards.find((c) => c.songName.toLowerCase().includes(searchQuery.toLowerCase()))
      if (card) {
        setSelectedCard(card)
        setSelectedUser(null)
        setShowSuggestions(false)
      }
    }
  }

  const handleSelectUserSuggestion = (suggestion: any) => {
    setSearchQuery(suggestion.username)
    setSelectedUser(suggestion)
    setSelectedCard(null)
    setShowSuggestions(false)
  }

  const handleSelectCardSuggestion = (suggestion: any) => {
    setSearchQuery(suggestion.songName)
    setSelectedCard(suggestion)
    setSelectedUser(null)
    setShowSuggestions(false)
  }

  const getDateRange = () => {
    const now = selectedDate
    let start = new Date(now)
    let label = ""

    if (timeScale === "day") {
      label = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } else if (timeScale === "week") {
      start.setDate(now.getDate() - now.getDay())
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      label = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      label = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }

    return { start, label }
  }

  const { label: dateLabel } = getDateRange()

  const searchResults = searchType === "users" ? mockUsers : mockCards

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex gap-4">
          <Select
            value={searchType}
            onValueChange={(value: "users" | "cards") => {
              setSearchType(value)
              setSelectedUser(null)
              setSelectedCard(null)
              setSearchQuery("")
              setShowSuggestions(false)
            }}
          >
            <SelectTrigger className="w-[180px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Stats
                </div>
              </SelectItem>
              <SelectItem value="cards">
                <div className="flex items-center gap-2">
                  <Music2 className="h-4 w-4" />
                  Card Stats
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchType === "users" ? "Search for a user..." : "Search for a card..."}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              className="pl-10 bg-card border-border"
            />
            {searchType === "users" && (
              <SearchSuggestions
                suggestions={mockUsers.map((u) => ({
                  id: u.username,
                  label: u.username,
                  sublabel: `${u.cards} cards • ${u.energy} energy`,
                  ...u,
                }))}
                searchQuery={searchQuery}
                isOpen={showSuggestions}
                onSelectSuggestion={handleSelectUserSuggestion}
              />
            )}
            {searchType === "cards" && (
              <SearchSuggestions
                suggestions={mockCards.map((c) => ({
                  id: c.id,
                  label: c.songName,
                  sublabel: `${c.artistName} • ${c.momentum} momentum`,
                  ...c,
                }))}
                searchQuery={searchQuery}
                isOpen={showSuggestions}
                onSelectSuggestion={handleSelectCardSuggestion}
              />
            )}
          </div>
        </div>

        {selectedUser ? (
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
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Search
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Energy</p>
                    <p className="text-2xl font-bold text-primary">{selectedUser.energy.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    <Music2 className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cards</p>
                    <p className="text-2xl font-bold text-secondary">{selectedUser.cards}</p>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Momentum</p>
                    <p className="text-2xl font-bold">{selectedUser.avgMomentum}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex gap-4">
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
                    {scale === "day" ? "Day" : scale === "week" ? "Week" : "Month"}
                  </button>
                ))}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span>{dateLabel}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showDatePicker && (
                  <div className="absolute right-0 mt-2 z-50 rounded-lg border border-border bg-card p-4 shadow-lg">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split("T")[0]}
                      onChange={(e) => {
                        setSelectedDate(new Date(e.target.value))
                      }}
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border bg-card p-6">
                <h3 className="mb-6 text-xl font-bold">Energy Over Time</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                      <XAxis dataKey="date" stroke="#a0a0a0" />
                      <YAxis stroke="#a0a0a0" />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        stroke="#00ff9d"
                        strokeWidth={3}
                        dot={{ fill: "#00ff9d" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="border-border bg-card p-6">
                <h3 className="mb-6 text-xl font-bold">Momentum Over Time</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={momentumOverTimeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                      <XAxis dataKey="date" stroke="#a0a0a0" />
                      <YAxis stroke="#a0a0a0" />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="momentum"
                        stroke="#ff5c93"
                        strokeWidth={3}
                        dot={{ fill: "#ff5c93" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card className="border-border bg-card p-6">
              <h3 className="mb-6 text-xl font-bold">Recent Trades</h3>
              <div className="space-y-4">
                <TradeCardDisplay
                  givenCards={[
                    {
                      songName: "Blinding Lights",
                      artistName: "The Weeknd",
                      albumArtUrl: "/blinding-lights.jpg",
                      momentum: 98,
                      energy: 3500,
                    },
                  ]}
                  receivedCards={[
                    {
                      songName: "Shivers",
                      artistName: "Ed Sheeran",
                      albumArtUrl: "/shivers.jpg",
                      momentum: 92,
                      energy: 3200,
                    },
                  ]}
                  tradedWith="BeatCollector"
                  timeAgo="2 hours ago"
                />
                <TradeCardDisplay
                  givenCards={[
                    {
                      songName: "Heat Waves",
                      artistName: "Glass Animals",
                      albumArtUrl: "/heat-waves.jpg",
                      momentum: 92,
                      energy: 3100,
                    },
                    {
                      songName: "Easy On Me",
                      artistName: "Adele",
                      albumArtUrl: "/easy-on-me.jpg",
                      momentum: 89,
                      energy: 2900,
                    },
                    {
                      songName: "Stay",
                      artistName: "The Kid LAROI & Justin Bieber",
                      albumArtUrl: "/stay-kid-laroi.jpg",
                      momentum: 91,
                      energy: 3000,
                    },
                  ]}
                  receivedCards={[
                    {
                      songName: "Anti-Hero",
                      artistName: "Taylor Swift",
                      albumArtUrl: "/anti-hero.jpg",
                      momentum: 94,
                      energy: 3300,
                    },
                    {
                      songName: "Flowers",
                      artistName: "Miley Cyrus",
                      albumArtUrl: "/flowers.jpg",
                      momentum: 90,
                      energy: 3050,
                    },
                  ]}
                  tradedWith="SoundWave"
                  timeAgo="5 hours ago"
                />
              </div>
            </Card>
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

                <Card className="border-border bg-card p-6">
                  <h3 className="mb-4 text-xl font-bold">Popularity</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { week: "Week 1", owned: 800 },
                          { week: "Week 2", owned: 950 },
                          { week: "Week 3", owned: 1050 },
                          { week: "Week 4", owned: 1180 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                        <XAxis dataKey="week" stroke="#a0a0a0" />
                        <YAxis stroke="#a0a0a0" />
                        <ChartTooltip />
                        <Line
                          type="monotone"
                          dataKey="owned"
                          stroke="#00ff9d"
                          strokeWidth={3}
                          dot={{ fill: "#00ff9d" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* Search Results View */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{searchType === "users" ? "Top Users" : "Top Cards"}</h2>

            {searchType === "users" ? (
              <div className="grid gap-4">
                {searchResults.map((result: any, index) => (
                  <Card
                    key={index}
                    onClick={() => {
                      setSelectedUser(result)
                    }}
                    className="cursor-pointer border-border bg-card p-6 transition-all hover:border-primary hover:bg-card/80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-black">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{result.username}</h3>
                          <p className="text-sm text-muted-foreground">{result.cards} cards</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Energy</p>
                          <p className="text-xl font-bold text-primary">{result.energy.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Momentum</p>
                          <p className="text-xl font-bold text-secondary">{result.avgMomentum}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {searchResults.map((result: any, index) => (
                  <Card
                    key={index}
                    onClick={() => setSelectedCard(result)}
                    className="cursor-pointer border-border bg-card p-6 transition-all hover:border-primary hover:bg-card/80"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary font-bold text-black">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{result.songName}</h3>
                          <p className="text-sm text-muted-foreground">{result.artistName}</p>
                        </div>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Momentum</p>
                          <p className="text-xl font-bold text-primary">{result.momentum}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Owned By</p>
                          <p className="text-xl font-bold text-secondary">{result.numOwned}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
