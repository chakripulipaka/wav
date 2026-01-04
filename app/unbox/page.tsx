"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles, Clock, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRequireAuth } from "@/contexts/AuthContext"
import { unboxApi, WheelTrack } from "@/lib/api"
import type { CardDisplay } from "@/lib/types"

export default function UnboxPage() {
  const { user } = useRequireAuth()
  const [step, setStep] = useState<"loading" | "idle" | "spinning" | "stopped" | "revealed">("loading")
  const [rotation, setRotation] = useState(0)
  const [unboxedCard, setUnboxedCard] = useState<CardDisplay | null>(null)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [nextUnboxTime, setNextUnboxTime] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNewCard, setIsNewCard] = useState(false)

  // Wheel tracks state
  const [wheelTracks, setWheelTracks] = useState<WheelTrack[]>([])
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null)
  const [isLoadingTracks, setIsLoadingTracks] = useState(true)

  // Load wheel tracks (used for refresh button)
  const loadWheelTracks = useCallback(async () => {
    setIsLoadingTracks(true)
    setError(null)

    const result = await unboxApi.getWheelTracks()

    if (result.error) {
      setError(result.error)
    } else if (result.data && result.data.tracks.length > 0) {
      setWheelTracks(result.data.tracks)
    } else {
      setError("No tracks available. Please try again.")
    }

    setIsLoadingTracks(false)
    setStep("idle")
  }, [])

  // Initialize on mount - load cooldown and tracks IN PARALLEL for speed
  useEffect(() => {
    async function initialize() {
      // Fetch BOTH API calls in parallel (major performance improvement)
      const [cooldownResult, tracksResult] = await Promise.all([
        unboxApi.getCooldown(),
        unboxApi.getWheelTracks()
      ])

      // Handle cooldown result
      if (cooldownResult.data) {
        if (!cooldownResult.data.canUnbox && cooldownResult.data.nextUnboxTime) {
          setNextUnboxTime(cooldownResult.data.nextUnboxTime)
          updateCooldownTimer(cooldownResult.data.nextUnboxTime)
        }
      }

      // Handle tracks result
      if (tracksResult.error) {
        setError(tracksResult.error)
      } else if (tracksResult.data && tracksResult.data.tracks.length > 0) {
        setWheelTracks(tracksResult.data.tracks)
      } else {
        setError("No tracks available. Please try again.")
      }

      setIsLoadingTracks(false)
      setStep("idle")
    }
    initialize()
  }, [])

  // Update cooldown timer
  const updateCooldownTimer = (nextTime: string) => {
    const updateTimer = () => {
      const now = Date.now()
      const next = new Date(nextTime).getTime()
      const remaining = Math.max(0, Math.ceil((next - now) / 1000))
      setCooldownTime(remaining)

      if (remaining <= 0) {
        setNextUnboxTime(null)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }

  useEffect(() => {
    if (nextUnboxTime) {
      const cleanup = updateCooldownTimer(nextUnboxTime)
      return cleanup
    }
  }, [nextUnboxTime])

  // Calculate which segment the needle points to based on rotation
  // This is the inverse of the targetAngle calculation in handleStartSpin
  const calculateSelectedIndex = (finalRotation: number): number => {
    const numSegments = wheelTracks.length
    const segmentAngle = 360 / numSegments

    // Normalize rotation to 0-360 range
    const normalizedRotation = ((finalRotation % 360) + 360) % 360

    // Inverse of: targetAngle = 360 - (index + 0.5) * segmentAngle
    // Solving for index: index = (360 - normalizedRotation) / segmentAngle - 0.5
    const rawIndex = (360 - normalizedRotation) / segmentAngle - 0.5
    const index = Math.round(rawIndex + numSegments) % numSegments

    return index
  }

  const handleStartSpin = async () => {
    if (cooldownTime > 0 || isSpinning || wheelTracks.length === 0) return

    setError(null)
    setStep("spinning")
    setIsSpinning(true)
    setSelectedTrackIndex(null)

    // Pre-select a random winning segment
    const winningIndex = Math.floor(Math.random() * wheelTracks.length)
    const segmentAngle = 360 / wheelTracks.length

    // Calculate the target rotation to land on the winning segment's CENTER
    // Segment i's center is at angle: (i * segmentAngle - 90 + segmentAngle/2) = (i + 0.5) * segmentAngle - 90
    // To bring this to the needle position (-90°/top), we need rotation:
    // R = -90 - ((i + 0.5) * segmentAngle - 90) = -(i + 0.5) * segmentAngle
    // Converting to positive: R = 360 - (i + 0.5) * segmentAngle
    const targetAngle = (360 - (winningIndex + 0.5) * segmentAngle + 360) % 360

    // Normalize current rotation to 0-360
    const currentAngle = ((rotation % 360) + 360) % 360

    // Calculate additional rotation needed to reach target (always going forward/clockwise)
    let additionalRotation = (targetAngle - currentAngle + 360) % 360
    if (additionalRotation === 0) additionalRotation = 360 // Ensure at least one segment movement

    // Add multiple full rotations for visual effect
    const minRotations = 5
    const maxRotations = 8
    const fullRotations = Math.floor(minRotations + Math.random() * (maxRotations - minRotations))

    // Add a small random offset within the segment (so it doesn't always land dead center)
    const randomOffsetWithinSegment = (Math.random() - 0.5) * segmentAngle * 0.5

    // Calculate final target rotation
    const targetRotation = rotation + fullRotations * 360 + additionalRotation + randomOffsetWithinSegment

    // Animate the spin with smooth easing
    const startRotation = rotation
    const duration = 5000 // 5 seconds for smoother spin
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out quart for very smooth deceleration (feels more natural)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut

      setRotation(currentRotation)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        // Animation complete - set exact final rotation
        setRotation(targetRotation)
        setSelectedTrackIndex(winningIndex)
        setIsSpinning(false)
        setStep("stopped")
      }
    }

    requestAnimationFrame(animate)
  }

  const handleClaimCard = async () => {
    if (selectedTrackIndex === null || !wheelTracks[selectedTrackIndex]) return

    setError(null)
    const selectedTrack = wheelTracks[selectedTrackIndex]

    // Call the unbox API with the selected track
    const result = await unboxApi.unboxFromWheel(selectedTrack)

    if (result.error) {
      setError(result.error)
      setStep("idle")

      // Check if it's a cooldown error
      if (result.error.includes("wait")) {
        const cooldownResult = await unboxApi.getCooldown()
        if (cooldownResult.data?.nextUnboxTime) {
          setNextUnboxTime(cooldownResult.data.nextUnboxTime)
        }
      }
      return
    }

    if (result.data) {
      setUnboxedCard(result.data.card)
      setIsNewCard(result.data.isNew)
      setStep("revealed")
    }
  }

  const handleReset = async () => {
    setStep("loading")
    setRotation(0)
    setUnboxedCard(null)
    setSelectedTrackIndex(null)
    setIsNewCard(false)
    setWheelTracks([])

    // Refresh cooldown
    const result = await unboxApi.getCooldown()
    if (result.data && !result.data.canUnbox && result.data.nextUnboxTime) {
      setNextUnboxTime(result.data.nextUnboxTime)
    }

    // Load new tracks
    await loadWheelTracks()
  }

  const canSpin = cooldownTime === 0 && !isSpinning && wheelTracks.length > 0 && !isLoadingTracks

  const formatCooldown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Calculate dynamic font size and positioning based on longest track name
  // Ensures all names fit within the wheel boundary
  const wheelTextConfig = useMemo(() => {
    if (wheelTracks.length === 0) {
      return { fontSize: 14, startOffset: 55, availableWidth: 180 }
    }

    // Wheel geometry: 520px wheel = 260px radius
    const wheelRadius = 260
    const centerLabelRadius = 48 // Half of 96px center label
    const edgePadding = 15 // Padding from wheel edge

    // Available radial space for text
    const startOffset = centerLabelRadius + 8 // Start just after center label (~56px)
    const endOffset = wheelRadius - edgePadding // End before edge (~245px)
    const availableWidth = endOffset - startOffset // ~189px available for text

    // Find longest track name
    let longestName = ""
    for (const track of wheelTracks) {
      if (track.songName.length > longestName.length) {
        longestName = track.songName
      }
    }

    if (longestName.length === 0) {
      return { fontSize: 14, startOffset, availableWidth }
    }

    // Calculate font size so longest name fits in available width
    // Average character width is ~0.6 of font size for this font
    const charWidthRatio = 0.6
    const calculatedFontSize = availableWidth / (longestName.length * charWidthRatio)

    // Clamp between reasonable bounds (10px min, 18px max)
    const fontSize = Math.max(10, Math.min(18, calculatedFontSize))

    return { fontSize, startOffset, availableWidth }
  }, [wheelTracks])

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="mx-auto max-w-5xl px-6 py-12">
        {step !== "revealed" ? (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold">Spin to Unbox</h1>
              <p className="mt-2 text-muted-foreground">Spin the wheel and discover your next track</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            {/* Loading State */}
            {(step === "loading" || isLoadingTracks) && (
              <div className="flex flex-col items-center justify-center h-[500px]">
                <Loader2 className="h-12 w-12 animate-spin text-secondary mb-4" />
                <p className="text-muted-foreground">Loading tracks...</p>
              </div>
            )}

            {/* Wheel Container */}
            {!isLoadingTracks && wheelTracks.length > 0 && (
              <>
                <div className="relative mb-12 flex h-[600px] w-[600px] items-center justify-center overflow-visible">
                  {/* Outer Record Player Base */}
                  <div className="absolute inset-0 rounded-full border-8 border-muted-foreground/30 bg-gradient-to-b from-card to-card/80 shadow-2xl" />

                  {/* Needle at top */}
                  <div className="absolute top-0 z-30 flex flex-col items-center pointer-events-none">
                    <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-secondary drop-shadow-lg" />
                  </div>

                  {/* Spinning Wheel */}
                  <div
                    className={cn(
                      "relative h-[520px] w-[520px] rounded-full cursor-pointer",
                      canSpin && !isSpinning && "hover:scale-[1.02] transition-transform duration-200",
                      isSpinning && "cursor-not-allowed",
                    )}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      boxShadow:
                        step === "spinning" || step === "stopped"
                          ? "0 0 40px 20px rgba(255, 92, 147, 0.4), inset 0 0 60px 15px rgba(255, 92, 147, 0.2)"
                          : "0 0 20px 5px rgba(0, 0, 0, 0.3)",
                    }}
                    onClick={canSpin && step === "idle" ? handleStartSpin : undefined}
                  >
                    {/* Vinyl background */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-black via-slate-900 to-black shadow-inner" />

                    {/* Vinyl grooves */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute inset-0 rounded-full border border-slate-700/20"
                        style={{
                          margin: `${40 + i * 25}px`,
                        }}
                      />
                    ))}

                    {/* Wheel Segments with Song Names */}
                    {wheelTracks.map((track, index) => {
                      const segmentAngle = 360 / wheelTracks.length
                      const startAngle = index * segmentAngle - 90 // Start from top

                      // Alternate colors for segments
                      const colors = [
                        "rgba(255, 92, 147, 0.3)", // pink
                        "rgba(147, 51, 234, 0.3)", // purple
                        "rgba(59, 130, 246, 0.3)", // blue
                        "rgba(16, 185, 129, 0.3)", // green
                        "rgba(245, 158, 11, 0.3)", // amber
                      ]
                      const segmentColor = colors[index % colors.length]

                      return (
                        <div key={track.id}>
                          {/* Segment divider line */}
                          <div
                            className="absolute top-1/2 left-1/2 h-[1px] bg-slate-600/50"
                            style={{
                              width: "50%",
                              transformOrigin: "left center",
                              transform: `rotate(${startAngle}deg)`,
                            }}
                          />

                          {/* Song name label */}
                          <div
                            className="absolute"
                            style={{
                              left: "50%",
                              top: "50%",
                              width: "100%",
                              height: "100%",
                              transform: `translate(-50%, -50%) rotate(${startAngle + segmentAngle / 2}deg)`,
                              transformOrigin: "center",
                            }}
                          >
                            <div
                              className="absolute text-white font-semibold whitespace-nowrap"
                              style={{
                                fontSize: `${wheelTextConfig.fontSize}px`,
                                left: "50%",
                                top: "50%",
                                // Position text centered within the available radial space
                                marginLeft: `${wheelTextConfig.startOffset + wheelTextConfig.availableWidth / 2}px`,
                                transform: "translate(-50%, -50%)",
                                textShadow: "0 2px 8px rgba(0, 0, 0, 0.9)",
                                color: selectedTrackIndex === index && step === "stopped" ? "#00ff9d" : "#ffffff",
                              }}
                            >
                              {track.songName}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Center label */}
                    <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-secondary via-secondary/80 to-secondary shadow-lg border-4 border-secondary/50">
                      {isSpinning ? (
                        <Loader2 className="h-10 w-10 text-white animate-spin" />
                      ) : (
                        <Sparkles className="h-10 w-10 text-white animate-pulse" />
                      )}
                    </div>
                  </div>

                  {cooldownTime > 0 && step === "idle" && (
                    <div className="absolute bottom-4 flex items-center gap-2 bg-muted/80 rounded-full px-4 py-2 backdrop-blur">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span className="text-sm font-medium text-secondary">
                        {formatCooldown(cooldownTime)} until next unbox
                      </span>
                    </div>
                  )}
                </div>

                {/* Selected Track Preview */}
                {step === "stopped" && selectedTrackIndex !== null && wheelTracks[selectedTrackIndex] && (
                  <div className="mb-6 p-4 rounded-lg bg-card/50 border border-secondary/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <p className="text-center text-lg font-semibold text-secondary mb-1">
                      You landed on:
                    </p>
                    <p className="text-center text-xl font-bold">
                      {wheelTracks[selectedTrackIndex].songName}
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                      {wheelTracks[selectedTrackIndex].artistName}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {step === "idle" && (
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      onClick={handleStartSpin}
                      disabled={!canSpin}
                      className="gap-2"
                    >
                      {cooldownTime > 0 ? (
                        <>
                          <Clock className="h-5 w-5" />
                          Wait {formatCooldown(cooldownTime)}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Spin the Wheel
                        </>
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={loadWheelTracks}
                      disabled={isLoadingTracks || isSpinning}
                      className="gap-2 bg-transparent"
                    >
                      <RefreshCw className={cn("h-5 w-5", isLoadingTracks && "animate-spin")} />
                      New Tracks
                    </Button>
                  </div>
                )}

                {/* Claim Card Button */}
                {step === "stopped" && (
                  <Button
                    size="lg"
                    className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    onClick={handleClaimCard}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Claim Your Card
                  </Button>
                )}
              </>
            )}

            {/* No tracks available */}
            {!isLoadingTracks && wheelTracks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[400px]">
                <p className="text-muted-foreground mb-4">No tracks loaded</p>
                <Button onClick={loadWheelTracks} disabled={isLoadingTracks}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingTracks && "animate-spin")} />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Card Reveal
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold">
                {isNewCard ? "New Discovery!" : "Congratulations!"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isNewCard
                  ? "You've discovered a brand new card!"
                  : "You've unboxed a new card for your collection"}
              </p>
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
                {unboxedCard?.genre && (
                  <p className="text-sm text-primary mt-1 capitalize">{unboxedCard.genre}</p>
                )}
                <div className="mt-4 flex justify-center">
                  <div className="w-full max-w-md rounded-lg bg-card/50 p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <TrendingUp className="h-5 w-5 text-secondary" />
                      <p className="text-sm text-muted-foreground">Momentum</p>
                    </div>
                    <p className="text-3xl font-bold text-secondary">{unboxedCard?.momentum}</p>
                    <p className="text-xs text-muted-foreground mt-2">+{unboxedCard?.momentum} energy/hour</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Energy starts at 0 and grows by momentum every hour (max 100K)
                </p>
              </div>
            </Card>

            <div className="mt-8 flex gap-4">
              <Button size="lg" onClick={handleReset} disabled={cooldownTime > 0}>
                Unbox Another {cooldownTime > 0 && `(${formatCooldown(cooldownTime)})`}
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
