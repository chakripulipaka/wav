"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RefreshCcw, Loader2, AlertTriangle, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { BlackjackCard } from "@/components/blackjack-card"
import { MusicCard } from "@/components/music-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { cardsApi, blackjackApi } from "@/lib/api"
import type { CardDisplay } from "@/lib/types"
import type { BlackjackGameCard } from "@/lib/blackjack-utils"

type GameState = "idle" | "playing" | "banked" | "bust"

export default function DoubleOrBankPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [currentCards, setCurrentCards] = useState<BlackjackGameCard[]>([])
  const [gameState, setGameState] = useState<GameState>("idle")
  const [message, setMessage] = useState("")

  // Card deck from API (random Spotify cards)
  const [deck, setDeck] = useState<BlackjackGameCard[]>([])
  // User's personal cards (for staking)
  const [userCards, setUserCards] = useState<CardDisplay[]>([])
  const [stakedCard, setStakedCard] = useState<CardDisplay | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [claimedCount, setClaimedCount] = useState(0)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch random cards for deck AND user's personal cards for staking
  useEffect(() => {
    async function fetchCards() {
      if (!user) return
      setIsLoadingCards(true)

      // Fetch random cards from Spotify for the game deck
      const deckResult = await blackjackApi.getDeck()
      if (deckResult.data && deckResult.data.deck.length > 0) {
        setDeck(deckResult.data.deck)
      }

      // Fetch user's personal cards for staking
      const userCardsResult = await cardsApi.getUserCards(user.id)
      if (userCardsResult.data) {
        setUserCards(userCardsResult.data)
      }

      setIsLoadingCards(false)
    }
    fetchCards()
  }, [user])

  const drawCard = useCallback(() => {
    if (deck.length === 0) return null
    // Get a card that's not already on the board
    const available = deck.filter(d => !currentCards.find(c => c.id === d.id))
    if (available.length === 0) return deck[Math.floor(Math.random() * deck.length)]
    return available[Math.floor(Math.random() * available.length)]
  }, [deck, currentCards])

  // Pick a random card from user's collection to stake
  const pickRandomStakedCard = useCallback(() => {
    if (userCards.length === 0) return null
    const randomIndex = Math.floor(Math.random() * userCards.length)
    return userCards[randomIndex]
  }, [userCards])

  const startGame = () => {
    if (deck.length === 0 || userCards.length === 0) return

    // Pick a random card from user's collection to stake
    const cardToStake = pickRandomStakedCard()
    if (!cardToStake) return
    setStakedCard(cardToStake)

    // Draw first card
    const firstCard = drawCard()
    if (!firstCard) return

    setCurrentCards([firstCard])
    setGameState("playing")
    setMessage("")
    setClaimedCount(0)
  }

  const riskIt = async () => {
    const nextCard = drawCard()
    if (!nextCard) return

    const lastCard = currentCards[currentCards.length - 1]

    if (nextCard.momentum > lastCard.momentum) {
      // Success! Add card to board
      setCurrentCards(prev => [...prev, nextCard])
    } else {
      // Bust! Lost the staked card
      setCurrentCards(prev => [...prev, nextCard])
      setGameState("bust")
      setIsProcessing(true)

      try {
        if (user && stakedCard) {
          const removeResult = await blackjackApi.removeCard(user.id, stakedCard.id)
          if (removeResult.data) {
            setUserCards(prev => prev.filter(c => c.id !== stakedCard.id))
          }
        }
        setMessage("BUST! Card lost...")
      } catch (error) {
        console.error("Error removing card:", error)
        setMessage("BUST!")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const bank = async () => {
    setGameState("banked")
    setIsProcessing(true)

    try {
      // Claim all cards on the board
      const cardsToAdd = currentCards.map(card => ({
        id: card.id,
        song_name: card.song_name,
        artist_name: card.artist_name,
        album_art_url: card.album_art_url,
        momentum: card.momentum,
      }))

      const claimResult = await blackjackApi.claimCards(cardsToAdd)
      if (claimResult.data) {
        setClaimedCount(claimResult.data.addedCards.length)
        setMessage(`BANKED! +${claimResult.data.addedCards.length} cards!`)
      } else {
        setMessage("BANKED!")
      }
    } catch (error) {
      console.error("Error claiming cards:", error)
      setMessage("BANKED!")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setCurrentCards([])
    setStakedCard(null)
    setGameState("idle")
    setMessage("")
    setClaimedCount(0)
  }

  // Show loading state
  if (authLoading || isLoadingCards) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <Navigation />

        {/* Digitized Felt Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading game...</p>
        </div>
      </main>
    )
  }

  // Show message if no cards available
  if (deck.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <Navigation />

        {/* Digitized Felt Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">No cards available. Please try again later.</p>
          <Link href="/games" className="mt-4 text-primary hover:underline">
            Back to Games
          </Link>
        </div>
      </main>
    )
  }

  // Show message if user has no cards
  if (userCards.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <Navigation />

        {/* Digitized Felt Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <AlertTriangle className="h-12 w-12 text-secondary mb-4" />
          <p className="text-lg font-bold text-white mb-2">No cards in your collection</p>
          <p className="text-muted-foreground mb-4">You need at least one card to play. Unbox some cards first!</p>
          <Link href="/unbox" className="text-primary hover:underline font-bold">
            Go to Unbox
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-y-auto">
      <Navigation />

      {/* Digitized Felt Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 px-4 pt-20 pb-4 w-full max-w-7xl mx-auto overflow-y-auto">
        {/* Main Game Area */}
        <div className="flex flex-1 gap-6 lg:gap-10">
          {/* Left: Game */}
          <div className="flex flex-1 flex-col">
            <div className="mb-4 flex items-center justify-between flex-shrink-0">
              <Link
                href="/games"
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK TO GAMES
              </Link>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-6 overflow-visible">
              <AnimatePresence mode="wait">
                {gameState === "idle" ? (
                  <motion.div
                    key="idle-ui"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-white">DOUBLE OR BANK</h1>
                      <p className="text-muted-foreground font-medium max-w-md">
                        Draw cards with increasing momentum. Bank anytime to keep them all, or risk it for more!
                      </p>
                    </div>

                    <Button
                      onClick={startGame}
                      className="h-16 px-12 rounded-2xl bg-secondary hover:bg-secondary/90 text-xl font-black shadow-[0_0_30px_rgba(255,64,129,0.3)] text-white"
                    >
                      TEST YOUR LUCK
                    </Button>

                    <p className="text-xs text-muted-foreground text-center max-w-sm">
                      A random card from your collection will be put at risk. Each new card must have higher momentum than the last.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="game-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center space-y-8 w-full"
                  >
                    {/* Cards on board */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {currentCards.map((card, idx) => (
                        <div key={`${card.id}-${idx}`} className="relative">
                          <BlackjackCard card={card} />
                          {idx === currentCards.length - 1 && gameState === "playing" && (
                            <motion.div
                              layoutId="active-indicator"
                              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-lg"
                            >
                              BEAT THIS
                            </motion.div>
                          )}
                          {idx === currentCards.length - 1 && gameState === "bust" && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-[9px] font-black px-2 py-0.5 rounded-full text-white shadow-lg"
                            >
                              LOWER!
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Message */}
                    {message && (
                      <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                          "text-2xl sm:text-3xl font-black uppercase tracking-tighter",
                          gameState === "banked"
                            ? "text-primary drop-shadow-[0_0_15px_rgba(0,255,157,0.6)]"
                            : "text-secondary drop-shadow-[0_0_15px_rgba(255,92,147,0.6)]"
                        )}
                      >
                        {message}
                      </motion.h2>
                    )}

                    {/* Controls */}
                    <div className="flex flex-col items-center space-y-4">
                      {gameState === "playing" && (
                        <div className="flex gap-4">
                          <Button
                            onClick={bank}
                            disabled={isProcessing}
                            variant="outline"
                            className="h-14 px-8 rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 font-bold"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              `BANK (${currentCards.length} CARDS)`
                            )}
                          </Button>
                          <Button
                            onClick={riskIt}
                            disabled={isProcessing}
                            className="h-14 px-12 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-black shadow-[0_0_30px_rgba(255,64,129,0.3)]"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              "RISK IT"
                            )}
                          </Button>
                        </div>
                      )}

                      {(gameState === "banked" || gameState === "bust") && (
                        <Button
                          onClick={reset}
                          disabled={isProcessing}
                          className="group flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-black uppercase tracking-tight text-black hover:bg-white/90"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              PLAY AGAIN
                              <RefreshCcw className="h-5 w-5 transition-transform group-hover:rotate-180" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Current streak info */}
                    {gameState === "playing" && currentCards.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>Streak: <span className="text-white font-bold">{currentCards.length}</span> card{currentCards.length !== 1 ? 's' : ''}</span>
                        <span className="text-white/30">•</span>
                        <span>Last momentum: <span className="text-secondary font-bold">{currentCards[currentCards.length - 1].momentum}</span></span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Staked Card Display */}
          <div className="hidden lg:flex flex-col items-center justify-center w-64 xl:w-72">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Card at Stake
              </span>

              {/* Staked Card */}
              <div className="relative w-40 xl:w-48">
                {stakedCard ? (
                  <motion.div
                    key={stakedCard.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={cn(
                      "relative rounded-2xl",
                      gameState === "banked"
                        ? "shadow-[0_0_40px_rgba(0,255,157,0.5)]"
                        : gameState === "bust"
                        ? "shadow-[0_0_40px_rgba(255,92,147,0.5)]"
                        : "shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    )}
                  >
                    <MusicCard card={stakedCard} showDelete={false} />

                    {/* Status Badge Overlay */}
                    {(gameState === "banked" || gameState === "bust") && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={cn(
                          "absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-black uppercase",
                          gameState === "banked"
                            ? "bg-primary text-black"
                            : "bg-secondary text-white"
                        )}
                      >
                        {gameState === "banked" ? "SAVED" : "LOST"}
                      </motion.div>
                    )}

                    {/* Loss Overlay */}
                    {gameState === "bust" && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-secondary/20 backdrop-blur-[1px] rounded-2xl pointer-events-none"
                      />
                    )}
                  </motion.div>
                ) : (
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">
                    <div className="text-center px-4">
                      <p className="text-xs text-white/40 font-medium">
                        Press TEST YOUR LUCK to stake a random card
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Warning */}
              {gameState === "idle" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] text-center text-white/30 max-w-[180px] leading-relaxed"
                >
                  A random card from your collection will be put at risk. Bank to keep it!
                </motion.p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Staked Card (shown at bottom on small screens) */}
      {stakedCard && (
        <div className="lg:hidden fixed bottom-4 right-4 z-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "relative w-28 rounded-xl",
              gameState === "banked"
                ? "shadow-[0_0_20px_rgba(0,255,157,0.5)]"
                : gameState === "bust"
                ? "shadow-[0_0_20px_rgba(255,92,147,0.5)]"
                : ""
            )}
          >
            <MusicCard card={stakedCard} showDelete={false} />
            {(gameState === "banked" || gameState === "bust") && (
              <div className={cn(
                "absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[7px] font-black uppercase",
                gameState === "banked" ? "bg-primary text-black" : "bg-secondary text-white"
              )}>
                {gameState === "banked" ? "✓" : "✗"}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  )
}
