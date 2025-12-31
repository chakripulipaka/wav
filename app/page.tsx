"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Music2, Users, Sparkles, Package, ArrowLeftRight, BarChart3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { usersApi, cardsApi } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import type { LeaderboardEntry, CardDisplay } from "@/lib/types"

export default function LandingPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [trendingCards, setTrendingCards] = useState<CardDisplay[]>([])
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true)
  const [isLoadingCards, setIsLoadingCards] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      const result = await usersApi.getLeaderboard()
      if (result.data) {
        setLeaderboard(result.data)
      }
      setIsLoadingLeaderboard(false)
    }

    async function fetchTrendingCards() {
      const result = await cardsApi.getAll(1, 9)
      if (result.data) {
        // Sort by momentum descending and take top 9
        const sorted = result.data.cards
          .sort((a, b) => b.momentum - a.momentum)
          .slice(0, 9)
          .map((card) => ({
            id: card.id,
            songName: card.song_name,
            artistName: card.artist_name,
            albumArtUrl: card.album_art_url,
            momentum: card.momentum,
            energy: card.energy,
            bpm: card.bpm,
          }))
        setTrendingCards(sorted)
      }
      setIsLoadingCards(false)
    }

    fetchLeaderboard()
    fetchTrendingCards()
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Collect. Trade. Discover.</span>
            </div>
            <h1 className="mb-6 max-w-4xl text-balance text-6xl font-bold leading-tight tracking-tight font-serif">
              Your Music Collection,
              <br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Gamified</span>
            </h1>
            <p className="mb-8 max-w-2xl text-balance text-xl text-muted-foreground leading-relaxed">
              Build your deck of music cards, trade with friends, and compete on the leaderboard. Every song has stats,
              every card has value.
            </p>
            <div className="flex gap-4">
              {authLoading ? (
                <Button size="lg" className="h-12 px-8" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </Button>
              ) : isAuthenticated ? (
                <Link href="/deck">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Go to My Deck
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Get Started
                  </Button>
                </Link>
              )}
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold bg-transparent">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2/3 - Trending Cards & Leaderboard */}
          <div className="space-y-6 lg:col-span-2">
            {/* Leaderboard */}
            <Card className="overflow-hidden border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold font-serif">Top Collectors</h2>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              {isLoadingLeaderboard ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No collectors yet. Be the first!
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-[0_0_20px_rgba(255,92,147,0.3)]"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full font-bold",
                            index === 0 && "bg-primary text-primary-foreground",
                            index === 1 && "bg-muted-foreground/20 text-foreground",
                            index === 2 && "bg-secondary/20 text-secondary",
                            index > 2 && "bg-muted text-muted-foreground",
                          )}
                        >
                          {index + 1}
                        </div>
                        <span className="font-medium">{entry.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">{entry.total_energy.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">energy</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Trending Cards */}
            <Card className="overflow-hidden border-border bg-card p-6">
              <div className="mb-6 flex items-center gap-2">
                <h2 className="text-2xl font-bold font-serif">Trending Now</h2>
              </div>
              {isLoadingCards ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : trendingCards.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No trending cards yet. Check back soon!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {trendingCards.map((card) => (
                    <div
                      key={card.id}
                      className="group relative overflow-hidden rounded-lg border border-border bg-muted/30 transition-all hover:scale-105 hover:border-primary hover:shadow-[0_0_20px_rgba(255,92,147,0.3)]"
                    >
                      <div className="aspect-square">
                        <img
                          src={card.albumArtUrl || "/placeholder.svg"}
                          alt={card.songName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="truncate text-sm font-semibold">{card.songName}</h3>
                        <p className="truncate text-xs text-muted-foreground">{card.artistName}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Momentum</span>
                          <span className="text-sm font-bold text-secondary">{card.momentum}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right 1/3 - Login/Signup */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 overflow-hidden border-border bg-card">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
                    <Music2 className="h-8 w-8 text-black" />
                  </div>
                  <h3 className="text-2xl font-bold font-serif">
                    Join W<span className="text-primary">AV</span>
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">Start building your music collection today</p>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {authLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : isAuthenticated ? (
                    <>
                      <Link href="/deck" className="block">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                          View My Deck
                        </Button>
                      </Link>
                      <Link href="/unbox" className="block">
                        <Button variant="outline" className="w-full bg-transparent" size="lg">
                          Unbox New Cards
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block">
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/login?mode=signup" className="block">
                        <Button variant="outline" className="w-full bg-transparent" size="lg">
                          Create Account
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
                <div className="mt-6 space-y-4 border-t border-border pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Daily Unboxing</h4>
                      <p className="text-sm text-muted-foreground">Get new cards every day</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                      <ArrowLeftRight className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Live Trading</h4>
                      <p className="text-sm text-muted-foreground">Trade with other collectors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Track Stats</h4>
                      <p className="text-sm text-muted-foreground">Analyze your collection</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
