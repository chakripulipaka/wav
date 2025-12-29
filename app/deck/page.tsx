"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { MusicCard } from "@/components/music-card"
import { DeleteCardModal } from "@/components/delete-card-modal"
import { Input } from "@/components/ui/input"
import { Search, Filter, TrendingUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data - in production this would come from the database
const mockDeck = [
  {
    id: 1,
    songName: "Blinding Lights",
    artistName: "The Weeknd",
    albumArtUrl: "/blinding-lights.jpg",
    momentum: 98,
    energy: 450,
    bpm: 171,
  },
  {
    id: 2,
    songName: "As It Was",
    artistName: "Harry Styles",
    albumArtUrl: "/as-it-was.jpg",
    momentum: 95,
    energy: 420,
    bpm: 174,
  },
  {
    id: 3,
    songName: "Heat Waves",
    artistName: "Glass Animals",
    albumArtUrl: "/heat-waves.jpg",
    momentum: 92,
    energy: 380,
    bpm: 130,
  },
  {
    id: 4,
    songName: "Shivers",
    artistName: "Ed Sheeran",
    albumArtUrl: "/shivers.jpg",
    momentum: 89,
    energy: 350,
    bpm: 141,
  },
  {
    id: 5,
    songName: "Stay",
    artistName: "The Kid LAROI & Justin Bieber",
    albumArtUrl: "/stay-kid-laroi.jpg",
    momentum: 87,
    energy: 340,
    bpm: 169,
  },
  {
    id: 6,
    songName: "Easy On Me",
    artistName: "Adele",
    albumArtUrl: "/easy-on-me.jpg",
    momentum: 85,
    energy: 330,
    bpm: 68,
  },
  {
    id: 7,
    songName: "Ghost",
    artistName: "Justin Bieber",
    albumArtUrl: "/ghost.jpg",
    momentum: 83,
    energy: 320,
    bpm: 80,
  },
  {
    id: 8,
    songName: "Levitating",
    artistName: "Dua Lipa",
    albumArtUrl: "/levitating.jpg",
    momentum: 81,
    energy: 310,
    bpm: 103,
  },
  {
    id: 9,
    songName: "Good 4 U",
    artistName: "Olivia Rodrigo",
    albumArtUrl: "/good-4-u.jpg",
    momentum: 79,
    energy: 300,
    bpm: 164,
  },
  {
    id: 10,
    songName: "Peaches",
    artistName: "Justin Bieber",
    albumArtUrl: "/peaches.jpg",
    momentum: 77,
    energy: 290,
    bpm: 90,
  },
  {
    id: 11,
    songName: "Save Your Tears",
    artistName: "The Weeknd",
    albumArtUrl: "/save-your-tears.jpg",
    momentum: 75,
    energy: 280,
    bpm: 118,
  },
  {
    id: 12,
    songName: "drivers license",
    artistName: "Olivia Rodrigo",
    albumArtUrl: "/drivers-license-mockup.png",
    momentum: 73,
    energy: 270,
    bpm: 144,
  },
]

export default function MyDeckPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [artistFilter, setArtistFilter] = useState("all")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<(typeof mockDeck)[0] | null>(null)
  const [deck, setDeck] = useState(mockDeck)

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

  const handleDeleteClick = (card: (typeof mockDeck)[0]) => {
    setSelectedCard(card)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedCard) {
      setDeck(deck.filter((card) => card.id !== selectedCard.id))
      setDeleteModalOpen(false)
      setSelectedCard(null)
    }
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-[1800px] px-6 py-8">
        {/* Stats Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              My W<span className="text-primary">AV</span>
            </h1>
            <p className="mt-2 text-muted-foreground">{deck.length} cards in your collection</p>
          </div>
          <div className="flex gap-6">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="mt-1 text-2xl font-bold text-primary">{totalEnergy.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Avg Momentum</p>
              <p className="mt-1 text-2xl font-bold text-secondary">{Math.round(totalMomentum / deck.length)}</p>
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

        {/* Card Grid */}
        {filteredDeck.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="text-2xl font-bold">No cards found</h2>
            <p className="mt-2 text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {filteredDeck.map((card) => (
              <MusicCard key={card.id} card={card} onDelete={() => handleDeleteClick(card)} />
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <DeleteCardModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        cardName={selectedCard?.songName || ""}
      />
    </div>
  )
}
