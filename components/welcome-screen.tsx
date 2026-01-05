"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GenreSelector } from "@/components/genre-selector"
import { ArtistSelector } from "@/components/artist-selector"
import { ArtistPreference } from "@/lib/types"
import { Loader2, Music2 } from "lucide-react"

interface WelcomeScreenProps {
  onComplete: (genres: string[], artists: ArtistPreference[]) => Promise<void>
  onSkip: () => Promise<void>
}

export function WelcomeScreen({ onComplete, onSkip }: WelcomeScreenProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedArtists, setSelectedArtists] = useState<ArtistPreference[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onComplete(selectedGenres, selectedArtists)
  }

  const handleSkip = async () => {
    setIsSaving(true)
    await onSkip()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="w-full max-w-3xl mx-6 rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Music2 className="h-8 w-8 text-black" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center font-serif">
            Welcome to W<span className="text-primary">AV</span>!
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Customize your experience by selecting your favorite genres and artists.
            <br />
            Cards you receive will be influenced by these choices.
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Top Genres */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Top Genres</h2>
            <GenreSelector
              selected={selectedGenres}
              onChange={setSelectedGenres}
              disabled={isSaving}
            />
          </div>

          {/* Top Artists */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Top Artists</h2>
            <ArtistSelector
              selected={selectedArtists}
              onChange={setSelectedArtists}
              disabled={isSaving}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-semibold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
            <Button
              onClick={handleSkip}
              disabled={isSaving}
              variant="outline"
              className="flex-1 bg-transparent h-12 text-base font-semibold"
            >
              Skip for Now
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't worry, you can always change these later in your profile settings
          </p>
        </div>
      </div>
    </div>
  )
}
