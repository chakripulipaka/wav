"use client"

import { AVAILABLE_GENRES } from "@/lib/types"
import { cn } from "@/lib/utils"

interface GenreSelectorProps {
  selected: string[]
  onChange: (genres: string[]) => void
  disabled?: boolean
}

const genreDisplayNames: Record<string, string> = {
  rap: "Rap",
  pop: "Pop",
  rock: "Rock",
  electronic: "Electronic",
  rnb: "R&B",
  jazz: "Jazz",
  country: "Country",
  latin: "Latin",
  indie: "Indie",
  metal: "Metal",
}

export function GenreSelector({ selected, onChange, disabled }: GenreSelectorProps) {
  const toggleGenre = (genre: string) => {
    if (disabled) return

    if (selected.includes(genre)) {
      onChange(selected.filter((g) => g !== genre))
    } else {
      onChange([...selected, genre])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AVAILABLE_GENRES.map((genre) => {
        const isSelected = selected.includes(genre)
        return (
          <button
            key={genre}
            type="button"
            onClick={() => toggleGenre(genre)}
            disabled={disabled}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,157,0.3)]"
                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {genreDisplayNames[genre] || genre}
          </button>
        )
      })}
    </div>
  )
}
