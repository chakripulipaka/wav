"use client"

import { Navigation } from "@/components/navigation"
import { GameCard } from "@/components/game-card"
import { useRequireAuth } from "@/contexts/AuthContext"
import { Loader2 } from "lucide-react"

// Spin Wheel Preview - Colorful wheel segments
function SpinWheelPreview() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-pink-900/40" />
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_8s_linear_infinite]">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path
              key={i}
              d={`M50,50 L50,5 A45,45 0 0,1 ${50 + 45 * Math.sin((Math.PI * (i + 1)) / 4)},${50 - 45 * Math.cos((Math.PI * (i + 1)) / 4)} Z`}
              fill={['#ff5c93', '#00ff9d', '#7b61ff', '#ffd93d', '#ff5c93', '#00ff9d', '#7b61ff', '#ffd93d'][i]}
              opacity="0.8"
              transform={`rotate(${i * 45} 50 50)`}
            />
          ))}
          <circle cx="50" cy="50" r="8" fill="#1e1e1e" stroke="#00ff9d" strokeWidth="2" />
        </svg>
      </div>
      <div className="absolute top-1/2 right-4 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-12 border-t-transparent border-b-transparent border-r-primary" />
    </div>
  )
}

// Blackjack Preview - Casino table with cards
function BlackjackPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0d4a2b]" />
      <div className="absolute inset-0 bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {/* Card 1 */}
        <div className="w-12 h-16 bg-white rounded-md shadow-lg transform -rotate-6 flex items-center justify-center">
          <span className="text-red-500 text-xl font-bold">A</span>
        </div>
        {/* Card 2 */}
        <div className="w-12 h-16 bg-white rounded-md shadow-lg transform rotate-3 flex items-center justify-center">
          <span className="text-black text-xl font-bold">K</span>
        </div>
        {/* Card 3 - face down */}
        <div className="w-12 h-16 bg-gradient-to-br from-[#1DB954] to-[#0d4a2b] rounded-md shadow-lg transform rotate-12 border border-white/20">
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.1)_4px,rgba(255,255,255,0.1)_8px)] rounded-md" />
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-primary font-bold text-sm">21</div>
    </div>
  )
}

// Double or Bank Preview - Risk/reward cards
function DoubleOrBankPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0d4a2b]" />
      <div className="absolute inset-0 bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Stack of cards */}
        <div className="relative">
          <div className="absolute -left-2 -top-1 w-14 h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg opacity-60" />
          <div className="absolute -left-1 -top-0.5 w-14 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg opacity-80" />
          <div className="relative w-14 h-20 bg-white rounded-lg shadow-xl flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-primary">2x</span>
          </div>
        </div>
        {/* Arrows */}
        <div className="absolute right-8 flex flex-col gap-1">
          <div className="text-primary text-2xl">↑</div>
          <div className="text-secondary text-2xl">↓</div>
        </div>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="px-2 py-1 bg-primary/20 rounded text-primary text-xs font-bold">DOUBLE</div>
        <div className="px-2 py-1 bg-secondary/20 rounded text-secondary text-xs font-bold">BANK</div>
      </div>
    </div>
  )
}

// Stacker Preview - Arcade blocks
function StackerPreview() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1DB954_1px,transparent_1px),linear-gradient(to_bottom,#1DB954_1px,transparent_1px)] [background-size:15px_15px] opacity-20" />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 gap-1">
        {/* Stacked blocks */}
        <div className="flex gap-0.5">
          <div className="w-6 h-4 bg-primary rounded-sm shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
          <div className="w-6 h-4 bg-primary rounded-sm shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
          <div className="w-6 h-4 bg-primary rounded-sm shadow-[0_0_10px_rgba(0,255,157,0.5)]" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-6 h-4 bg-primary/80 rounded-sm" />
          <div className="w-6 h-4 bg-primary/80 rounded-sm" />
          <div className="w-6 h-4 bg-primary/80 rounded-sm" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-6 h-4 bg-primary/60 rounded-sm" />
          <div className="w-6 h-4 bg-primary/60 rounded-sm" />
          <div className="w-6 h-4 bg-primary/60 rounded-sm" />
          <div className="w-6 h-4 bg-primary/60 rounded-sm" />
        </div>
        <div className="flex gap-0.5">
          <div className="w-6 h-4 bg-primary/40 rounded-sm" />
          <div className="w-6 h-4 bg-primary/40 rounded-sm" />
          <div className="w-6 h-4 bg-primary/40 rounded-sm" />
          <div className="w-6 h-4 bg-primary/40 rounded-sm" />
          <div className="w-6 h-4 bg-primary/40 rounded-sm" />
        </div>
      </div>
      {/* Moving block indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-0.5 animate-pulse">
        <div className="w-6 h-4 bg-secondary rounded-sm shadow-[0_0_15px_rgba(255,92,147,0.6)]" />
        <div className="w-6 h-4 bg-secondary rounded-sm shadow-[0_0_15px_rgba(255,92,147,0.6)]" />
        <div className="w-6 h-4 bg-secondary rounded-sm shadow-[0_0_15px_rgba(255,92,147,0.6)]" />
      </div>
    </div>
  )
}

const games = [
  {
    id: "unbox-wheel",
    title: "Spin to Unbox",
    description: "The classic track unboxing experience. Spin the wheel to discover your next high-energy track.",
    previewComponent: <SpinWheelPreview />,
    category: "Featured",
    href: "/unbox",
  },
  {
    id: "blackjack",
    title: "Vinyl Blackjack",
    description: "Beat the house and score high. A rhythm-based card game where strategy earns you rare momentum.",
    previewComponent: <BlackjackPreview />,
    category: "Casino",
    href: "/games/blackjack",
  },
  {
    id: "double-or-bank",
    title: "Double or Bank",
    description: "High-stakes risk management. Draw sequential cards with increasing momentum to build a legendary streak.",
    previewComponent: <DoubleOrBankPreview />,
    category: "High Stakes",
    href: "/games/double-or-bank",
  },
  {
    id: "stacker",
    title: "Neon Stacker",
    description: "The classic arcade test of timing and precision. Stack the blocks to reach the elite heights and win energy.",
    previewComponent: <StackerPreview />,
    category: "Arcade",
    href: "/games/stacker",
  },
]

export default function GamesPage() {
  const { user } = useRequireAuth()

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Choose Your <span className="text-secondary">Game</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Earn cards, build your collection, and boost your momentum by playing our exclusive selection of musical games.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}

          {/* Future Game Placeholder */}
          <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-all hover:bg-muted/50 hover:shadow-[0_0_20px_rgba(255,92,147,0.2)]">
            <div>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <span className="text-2xl font-bold text-muted-foreground">+</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">New Game</h3>
              <p className="mt-1 text-xs text-muted-foreground/60">Coming soon to the WAV ecosystem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
