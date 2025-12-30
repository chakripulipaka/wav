"use client"

import { useState, useEffect, use } from "react"
import { Navigation } from "@/components/navigation"
import { MusicCard } from "@/components/music-card"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Filter, TrendingUp, Loader2, Lock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { cardsApi, usersApi } from "@/lib/api"
import type { CardDisplay, Profile } from "@/lib/types"

interface PublicDeckPageProps {
  params: Promise<{ userId: string }>
}

export default function PublicDeckPage({ params }: PublicDeckPageProps) {
  const { userId } = use(params)
  const { user: currentUser } = useAuth()
  const isOwner = currentUser?.id === userId

  const [searchQuery, setSearchQuery] = useState("")
  const [artistFilter, setArtistFilter] = useState("all")
  const [deck, setDeck] = useState<CardDisplay[]>([])
  const [profileUser, setProfileUser] = useState<Pick<Profile, "id" | "username" | "avatar_url" | "deck_privacy"> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)

  // Fetch user info and cards
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)
      setIsPrivate(false)

      // Fetch user profile
      const userResult = await usersApi.getProfile(userId)
      if (userResult.error) {
        setError(userResult.error)
        setIsLoading(false)
        return
      }

      if (userResult.data) {
        setProfileUser(userResult.data)
      }

      // Fetch user's cards
      const cardsResult = await cardsApi.getUserCards(userId)

      if (cardsResult.error) {
        if (cardsResult.error === "This deck is private") {
          setIsPrivate(true)
        } else {
          setError(cardsResult.error)
        }
      } else if (cardsResult.data) {
        setDeck(cardsResult.data)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [userId])

  // If owner, redirect to their own deck page
  if (isOwner) {
    if (typeof window !== "undefined") {
      window.location.href = "/deck"
    }
    return null
  }

  // Get unique artists for filter
  const artists = ["all", ...Array.from(new Set(deck.map((card) => card.artistName)))]

  // Filter deck based on search and filters
  const filteredDeck = deck.filter((card) => {
    const matchesSearch =
      searchQuery === "" ||
      card.songName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.artistName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesArtist = artistFilter === "all" || card.artistName === artistFilter

    return matchesSearch && matchesArtist
  })

  // Calculate total stats
  const totalEnergy = deck.reduce((sum, card) => sum + card.energy, 0)
  const totalMomentum = deck.reduce((sum, card) => sum + card.momentum, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  // Show private message
  if (isPrivate) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="mx-auto max-w-[1800px] px-6 py-8">
          <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <Lock className="h-16 w-16 text-muted-foreground" />
            <div>
              <h1 className="text-2xl font-bold">Private Deck</h1>
              <p className="mt-2 text-muted-foreground">
                {profileUser?.username || "This user"}&apos;s deck is private.
              </p>
              <p className="text-sm text-muted-foreground/70">
                Only they can view their collection.
              </p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Show error
  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="mx-auto max-w-[1800px] px-6 py-8">
          <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <div className="text-destructive">
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="mt-2">{error}</p>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const username = profileUser?.username || "User"

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-[1800px] px-6 py-8">
        {/* Stats Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              {username}&apos;s W<span className="text-primary">AV</span>
            </h1>
            <p className="mt-2 text-muted-foreground">{deck.length} cards in collection</p>
          </div>
          <div className="flex gap-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="mt-1 text-2xl font-bold text-primary">{totalEnergy.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Momentum</p>
              <p className="mt-1 text-2xl font-bold text-secondary">
                {totalMomentum}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by song or artist name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={artistFilter} onValueChange={setArtistFilter}>
            <SelectTrigger className="w-[200px] bg-card border-border">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by artist" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Artists</SelectItem>
              {artists.slice(1).map((artist) => (
                <SelectItem key={artist} value={artist}>
                  {artist}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Card Grid - Read only (no delete) */}
        {filteredDeck.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold">
              {deck.length === 0 ? "No cards yet" : "No cards found"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {deck.length === 0
                ? `${username} hasn't collected any cards yet.`
                : "Try adjusting your filters or search query"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filteredDeck.map((card) => (
              <MusicCard key={card.id} card={card} showDelete={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
