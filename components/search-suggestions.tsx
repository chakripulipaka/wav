"use client"

import type React from "react"

import { useRef } from "react"

interface Suggestion {
  id: string | number
  label: string
  sublabel?: string
  [key: string]: any
}

interface SearchSuggestionsProps {
  suggestions: Suggestion[]
  searchQuery: string
  isOpen: boolean
  onSelectSuggestion: (suggestion: Suggestion) => void
  renderSuggestion?: (suggestion: Suggestion) => React.ReactNode
}

export function SearchSuggestions({
  suggestions,
  searchQuery,
  isOpen,
  onSelectSuggestion,
  renderSuggestion,
}: SearchSuggestionsProps) {
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const filteredSuggestions = suggestions.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!isOpen || searchQuery.length === 0 || filteredSuggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={suggestionsRef}
      className="absolute top-full z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg"
    >
      {filteredSuggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSelectSuggestion(suggestion)}
          className="w-full border-b border-border/50 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors last:border-b-0"
        >
          {renderSuggestion ? (
            renderSuggestion(suggestion)
          ) : (
            <div>
              <div className="font-medium">{suggestion.label}</div>
              {suggestion.sublabel && <div className="text-sm text-muted-foreground">{suggestion.sublabel}</div>}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
