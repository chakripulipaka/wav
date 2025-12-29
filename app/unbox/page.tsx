"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock song data - will be replaced with Spotify API later
const MOCK_SONGS = [
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", image: "/blinding-lights.jpg" },
  { id: 2, title: "As It Was", artist: "Harry Styles", image: "/as-it-was.jpg" },
  { id: 3, title: "Heat Waves", artist: "Glass Animals", image: "/heat-waves.jpg" },
  { id: 4, title: "Shivers", artist: "Ed Sheeran", image: "/shivers.jpg" },
  { id: 5, title: "Stay", artist: "The Kid LAROI", image: "/stay-kid-laroi.jpg" },
  { id: 6, title: "Easy On Me", artist: "Adele", image: "/easy-on-me.jpg" },
  { id: 7, title: "Industry Baby", artist: "Lil Nas X", image: "/blinding-lights.jpg" },
  { id: 8, title: "Levitating", artist: "Dua Lipa", image: "/as-it-was.jpg" },
  { id: 9, title: "Anti-Hero", artist: "Taylor Swift", image: "/heat-waves.jpg" },
  { id: 10, title: "Vampire", artist: "Olivia Rodrigo", image: "/shivers.jpg" },
]

export default function UnboxPage() {
  const [step, setStep] = useState<"idle" | "spinning" | "stopped" | "revealed">("idle")
  const [rotation, setRotation] = useState(0)
  const [unboxedCard, setUnboxedCard] = useState<any>(null)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasStartedSpin, setHasStartedSpin] = useState(false)
  const [selectedSongIndex, setSelectedSongIndex] = useState<number | null>(null)

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [cooldownTime])

  const handleStartSpin = () => {
    if (cooldownTime > 0 || isSpinning) return

    setStep("spinning")
    setIsSpinning(true)
    setHasStartedSpin(true)

    // Generate random final rotation
    const spinsCount = 5 + Math.random() * 3 // 5-8 full rotations
    const randomOffset = Math.random() * 360
    const finalRotation = spinsCount * 360 + randomOffset

    // Initial velocity and friction
    let currentRotation = 0
    let velocity = finalRotation / 2 // Initial angular velocity
    const friction = 0.96 // Friction coefficient (0.96 = 4% loss per frame)
    const minVelocity = 0.1 // Stop when velocity is very small

    const spinInterval = setInterval(() => {
      velocity *= friction

      if (velocity < minVelocity) {
        clearInterval(spinInterval)
        const normalizedRotation = finalRotation % 360
        setRotation(normalizedRotation)

        const songIndex = Math.round((normalizedRotation / 360) * MOCK_SONGS.length) % MOCK_SONGS.length
        setSelectedSongIndex(songIndex)

        setStep("stopped")
        setIsSpinning(false)
        revealCard(songIndex)
      } else {
        currentRotation += velocity
        setRotation(currentRotation % 360)
      }
    }, 16)
  }

  const revealCard = (songIndex: number) => {
    const selectedSong = MOCK_SONGS[songIndex]

    // Simulate receiving a card from backend
    const mockCard = {
      id: Math.random(),
      songName: selectedSong.title,
      artistName: selectedSong.artist,
      albumArtUrl: selectedSong.image,
      momentum: 98,
      energy: 450,
      bpm: 171,
    }

    setUnboxedCard(mockCard)
    setCooldownTime(30) // Set 30-second cooldown
  }

  const handleViewCard = () => {
    setStep("revealed")
  }

  const handleReset = () => {
    setStep("idle")
    setRotation(0)
    setUnboxedCard(null)
    setHasStartedSpin(false)
    setSelectedSongIndex(null)
  }

  const canSpin = cooldownTime === 0 && !isSpinning

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-5xl px-6 py-12">
        {step !== "revealed" ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold">Unbox Your Next Card</h1>
              <p className="mt-2 text-muted-foreground">Spin the record player and see what song you get</p>
            </div>

            {/* Record Player Container */}
            <div className="relative mb-12 flex h-[650px] w-[650px] items-center justify-center overflow-visible">
              {/* Outer Record Player Base */}
              <div className="absolute inset-0 rounded-full border-8 border-muted-foreground/30 bg-gradient-to-b from-card to-card/80 shadow-2xl" />

              <div className="absolute top-0 z-30 flex flex-col items-center pointer-events-none">
                <div className="w-1 h-48 bg-gradient-to-b from-white to-gray-400 rounded-full shadow-lg" />
                <div className="w-4 h-4 bg-white rounded-full shadow-md" />
              </div>

              <div
                className={cn(
                  "relative h-[480px] w-[480px] rounded-full cursor-pointer transition-transform",
                  canSpin && "hover:scale-105",
                  step === "spinning" && "cursor-not-allowed",
                )}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: step !== "spinning" ? "transform 0.05s linear" : "none",
                  boxShadow:
                    step === "spinning" || step === "stopped"
                      ? "0 0 40px 20px rgba(255, 92, 147, 0.4), inset 0 0 60px 15px rgba(255, 92, 147, 0.2)"
                      : "none",
                }}
                onClick={canSpin ? handleStartSpin : undefined}
              >
                {/* Vinyl background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-black via-slate-900 to-black shadow-inner" />

                {/* Vinyl grooves */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border border-slate-700/30"
                    style={{
                      margin: `${25 + i * 18}px`,
                    }}
                  />
                ))}

                {hasStartedSpin &&
                  MOCK_SONGS.map((song, index) => {
                    const segmentAngle = 360 / MOCK_SONGS.length // 36 degrees per song
                    const startAngle = index * segmentAngle - 90 // Start angle for this segment

                    const textLength = song.title.length
                    const maxTextLength = 24 // "Blinding Lights" is ~15 chars, longest expected ~24
                    const textWidthPercent = Math.min((textLength / maxTextLength) * 100, 100)
                    const radiusStart = 60 // Inner radius in pixels from center
                    const radiusEnd = 230 // Outer radius in pixels from center
                    const textWidth = radiusEnd - radiusStart
                    const startOffset = ((100 - textWidthPercent) / 2) * (textWidth / 100) // Center shorter names

                    return (
                      <div
                        key={song.id}
                        className="absolute"
                        style={{
                          left: "50%",
                          top: "50%",
                          width: "100%",
                          height: "100%",
                          transform: `translate(-50%, -50%) rotate(${startAngle + 90}deg)`,
                          transformOrigin: "center",
                        }}
                      >
                        {/* Song text sliver */}
                        <div
                          className="absolute top-1/2 left-1/2 text-white font-bold whitespace-nowrap"
                          style={{
                            fontSize: "18px",
                            width: `${textWidth}px`,
                            marginLeft: `${startOffset}px`,
                            transform: "translateY(-50%)",
                            color: "#ffffff",
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
                          }}
                        >
                          {song.title}
                        </div>

                        {selectedSongIndex === index && step === "stopped" && (
                          <div
                            className="absolute inset-0 animate-pulse"
                            style={{
                              background: "linear-gradient(90deg, transparent, rgba(255, 92, 147, 0.4), transparent)",
                            }}
                          />
                        )}
                      </div>
                    )
                  })}

                {/* Center label - only visible before spin */}
                {!hasStartedSpin && (
                  <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-secondary via-secondary/80 to-secondary shadow-lg border-4 border-secondary/50">
                    <Sparkles className="h-12 w-12 text-white animate-pulse" />
                  </div>
                )}
              </div>

              <div className="absolute bottom-4 text-center">{/* Removed all status text messages */}</div>

              {cooldownTime > 0 && step === "idle" && (
                <div className="absolute bottom-4 flex items-center gap-2 bg-muted/80 rounded-full px-4 py-2 backdrop-blur">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">{cooldownTime}s until next unbox</span>
                </div>
              )}
            </div>

            {/* View Card Button */}
            {step === "stopped" && (
              <Button
                size="lg"
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                onClick={handleViewCard}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                View Your Song
              </Button>
            )}
          </div>
        ) : (
          // Card Reveal
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold">Congratulations!</h1>
              <p className="mt-2 text-muted-foreground">You've unboxed a new card</p>
            </div>

            <Card className="w-[350px] overflow-hidden border-2 border-secondary bg-card shadow-2xl shadow-secondary/20">
              <div className="aspect-square overflow-hidden">
                <img
                  src={unboxedCard?.albumArtUrl || "/placeholder.svg"}
                  alt={unboxedCard?.songName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="bg-gradient-to-br from-secondary/10 to-primary/10 p-6">
                <h2 className="text-2xl font-bold">{unboxedCard?.songName}</h2>
                <p className="text-lg text-muted-foreground">{unboxedCard?.artistName}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-card/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Momentum</p>
                    <p className="text-2xl font-bold text-secondary">{unboxedCard?.momentum}</p>
                  </div>
                  <div className="rounded-lg bg-card/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground">Energy</p>
                    <p className="text-2xl font-bold text-primary">{unboxedCard?.energy}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-8 flex gap-4">
              <Button size="lg" onClick={handleReset} disabled={cooldownTime > 0}>
                Unbox Another {cooldownTime > 0 && `(${cooldownTime}s)`}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent"
                onClick={() => (window.location.href = "/deck")}
              >
                View My Deck
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
