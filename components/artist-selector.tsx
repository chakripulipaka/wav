"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { spotifyApi } from "@/lib/api"
import { ArtistPreference } from "@/lib/types"
import { X, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ArtistSelectorProps {
  selected: ArtistPreference[]
  onChange: (artists: ArtistPreference[]) => void
  disabled?: boolean
}

export function ArtistSelector({ selected, onChange, disabled }: ArtistSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ArtistPreference[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim().length === 0) {
      setResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      const response = await spotifyApi.searchArtists(query)
      if (response.data) {
        // Filter out already selected artists
        const selectedIds = new Set(selected.map((a) => a.id))
        setResults(response.data.artists.filter((a) => !selectedIds.has(a.id)))
        setShowDropdown(true)
      }
      setIsSearching(false)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, selected])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const addArtist = (artist: ArtistPreference) => {
    if (disabled) return
    onChange([...selected, artist])
    setQuery("")
    setResults([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  const removeArtist = (artistId: string) => {
    if (disabled) return
    onChange(selected.filter((a) => a.id !== artistId))
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length > 0 && results.length > 0 && setShowDropdown(true)}
            placeholder="Search for artists..."
            disabled={disabled}
            className="pl-10 pr-10 bg-background border-border"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Dropdown Results */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 py-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.map((artist) => (
              <button
                key={artist.id}
                type="button"
                onClick={() => addArtist(artist)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
              >
                {artist.image_url ? (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {artist.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-foreground">{artist.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {showDropdown && query.trim().length > 0 && results.length === 0 && !isSearching && (
          <div className="absolute z-50 w-full mt-1 py-3 px-4 bg-card border border-border rounded-lg shadow-lg text-sm text-muted-foreground">
            No artists found
          </div>
        )}
      </div>

      {/* Selected Artists */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((artist) => (
            <div
              key={artist.id}
              className={cn(
                "flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-primary/20 border border-primary/30",
                disabled && "opacity-50"
              )}
            >
              {artist.image_url ? (
                <img
                  src={artist.image_url}
                  alt={artist.name}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary/30 flex items-center justify-center text-xs font-medium">
                  {artist.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm text-foreground">{artist.name}</span>
              <button
                type="button"
                onClick={() => removeArtist(artist.id)}
                disabled={disabled}
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
