"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RefreshCcw, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { BlackjackCard } from "@/components/blackjack-card"
import { MusicCard } from "@/components/music-card"
import { Button } from "@/components/ui/button"
import {
  calculateMomentum,
  cardToBlackjackCard,
  displayToBlackjackCard,
  BUST_THRESHOLD,
  DEALER_STAND_THRESHOLD,
  type BlackjackGameCard
} from "@/lib/blackjack-utils"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { cardsApi, blackjackApi } from "@/lib/api"
import type { Card, CardDisplay } from "@/lib/types"

type GameState = "idle" | "playing" | "dealer-turn" | "resolved"

export default function BlackjackPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [playerHand, setPlayerHand] = useState<BlackjackGameCard[]>([])
  const [dealerHand, setDealerHand] = useState<BlackjackGameCard[]>([])
  const [gameState, setGameState] = useState<GameState>("idle")
  const [message, setMessage] = useState("Ready to play?")
  const [winResult, setWinResult] = useState<"win" | "lose" | "bust" | "push" | null>(null)

  // Card deck from API (all cards for gameplay)
  const [deck, setDeck] = useState<BlackjackGameCard[]>([])
  // User's personal cards (for staking)
  const [userCards, setUserCards] = useState<CardDisplay[]>([])
  const [stakedCard, setStakedCard] = useState<CardDisplay | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

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

      // Fetch random cards from Spotify for the game deck (truly random like wheel)
      const deckResult = await blackjackApi.getDeck()
      if (deckResult.data && deckResult.data.deck.length > 0) {
        setDeck(deckResult.data.deck)
      }

      // Fetch user's personal cards for staking (from their actual collection)
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
    return deck[Math.floor(Math.random() * deck.length)]
  }, [deck])

  // Pick a random card from user's collection to stake
  const pickRandomStakedCard = useCallback(() => {
    if (userCards.length === 0) return null
    const randomIndex = Math.floor(Math.random() * userCards.length)
    return userCards[randomIndex]
  }, [userCards])

  const startGame = async () => {
    if (deck.length === 0 || userCards.length === 0) return

    setIsProcessing(true)

    // Pick a random card from user's collection to stake
    const cardToStake = pickRandomStakedCard()
    if (!cardToStake) {
      setIsProcessing(false)
      return
    }
    setStakedCard(cardToStake)

    const p1 = drawCard()
    const d1 = drawCard()
    const p2 = drawCard()
    const d2 = drawCard()

    if (!p1 || !d1 || !p2 || !d2) {
      setIsProcessing(false)
      return
    }

    setPlayerHand([p1, p2])
    setDealerHand([d1, d2])
    setGameState("playing")
    setMessage("Hit or Stand?")
    setIsProcessing(false)
  }

  const hit = () => {
    const newCard = drawCard()
    if (!newCard) return

    const newHand = [...playerHand, newCard]
    setPlayerHand(newHand)

    if (calculateMomentum(newHand) > BUST_THRESHOLD) {
      resolveGame("bust")
    }
  }

  const stand = () => {
    setGameState("dealer-turn")
  }

  useEffect(() => {
    if (gameState === "dealer-turn") {
      const dealerTurn = async () => {
        let currentDealerHand = [...dealerHand]
        while (calculateMomentum(currentDealerHand) < DEALER_STAND_THRESHOLD) {
          await new Promise((resolve) => setTimeout(resolve, 800))
          const newCard = drawCard()
          if (!newCard) break
          currentDealerHand = [...currentDealerHand, newCard]
          setDealerHand(currentDealerHand)
        }

        const playerTotal = calculateMomentum(playerHand)
        const dealerTotal = calculateMomentum(currentDealerHand)

        if (dealerTotal > BUST_THRESHOLD || playerTotal > dealerTotal) {
          resolveGame("win")
        } else if (playerTotal < dealerTotal) {
          resolveGame("lose")
        } else {
          resolveGame("push")
        }
      }
      dealerTurn()
    }
  }, [gameState, dealerHand, playerHand, drawCard])

  const resolveGame = async (result: "win" | "lose" | "bust" | "push") => {
    setWinResult(result)
    setGameState("resolved")
    setIsProcessing(true)

    try {
      if (result === "win") {
        // User wins: Keep staked card AND gain all player hand cards
        const cardsToAdd = playerHand.map(card => ({
          id: card.id,
          song_name: card.song_name,
          artist_name: card.artist_name,
          album_art_url: card.album_art_url,
          momentum: card.momentum,
        }))

        const claimResult = await blackjackApi.claimCards(cardsToAdd)
        if (claimResult.data) {
          setMessage(`YOU WIN! +${playerHand.length} cards claimed!`)
        } else {
          setMessage("YOU WIN! Card saved!")
        }
      } else if (result === "lose" || result === "bust") {
        // User loses: Remove the staked card from their collection
        if (user && stakedCard) {
          const removeResult = await blackjackApi.removeCard(user.id, stakedCard.id)
          if (removeResult.data) {
            // Remove from local userCards state so they can't stake it again
            setUserCards(prev => prev.filter(c => c.id !== stakedCard.id))
          }
        }
        setMessage(result === "bust" ? "BUSTED! Card lost..." : "DEALER WINS! Card lost...")
      } else {
        // Push: Card is returned, no changes
        setMessage("PUSH! Card returned")
      }
    } catch (error) {
      console.error("Error processing game result:", error)
      setMessage(result === "win" ? "YOU WIN!" : result === "push" ? "PUSH!" : "YOU LOSE!")
    } finally {
      setIsProcessing(false)
    }
  }

  const reset = () => {
    setPlayerHand([])
    setDealerHand([])
    setStakedCard(null)
    setGameState("idle")
    setWinResult(null)
    setMessage("Ready to play?")
  }

  const playerTotal = calculateMomentum(playerHand)
  const dealerTotal = calculateMomentum(dealerHand)

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

        {/* Centered loading content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading game...</p>
        </div>
      </main>
    )
  }

  // Show message if no cards available or user has no cards
  if (deck.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <Navigation />

        {/* Digitized Felt Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>

        {/* Centered content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <p className="text-muted-foreground">No cards available. Please try again later.</p>
          <Link href="/games" className="mt-4 text-primary hover:underline">
            Back to Games
          </Link>
        </div>
      </main>
    )
  }

  if (userCards.length === 0) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden">
        <Navigation />

        {/* Digitized Felt Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="h-full w-full bg-[radial-gradient(#1DB954_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        </div>

        {/* Centered content */}
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
          {/* Left: Game Table */}
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between flex-shrink-0">
              <Link
                href="/games"
                className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                BACK TO GAMES
              </Link>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent p-4 sm:p-6 overflow-visible">
              {/* Dealer Hand */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">The House</span>
                  {gameState !== "idle" && (
                    <div className="flex items-center justify-center h-6 min-w-[24px] rounded-sm bg-white/10 px-1.5 text-[11px] font-black text-white border border-white/10">
                      {gameState === "playing" ? "?" : dealerTotal}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2">
                  {dealerHand.map((card, i) => (
                    <BlackjackCard key={`dealer-${i}-${card.id}`} card={card} isFlipped={i === 0 || gameState !== "playing"} />
                  ))}
                  {dealerHand.length === 0 && (
                    <div className="w-24 sm:w-28 md:w-32 rounded-lg border-2 border-dashed border-white/10 aspect-square" />
                  )}
                </div>
              </div>

              {/* Center Info */}
              <div className="flex flex-col items-center gap-1.5 text-center my-2 flex-shrink-0">
                <motion.h2
                  key={message}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "text-xl font-black uppercase tracking-tighter sm:text-3xl md:text-4xl",
                    gameState === "resolved" && winResult === "win"
                      ? "text-primary drop-shadow-[0_0_15px_rgba(0,255,157,0.6)]"
                      : gameState === "resolved" && (winResult === "lose" || winResult === "bust")
                      ? "text-secondary drop-shadow-[0_0_15px_rgba(255,92,147,0.6)]"
                      : "text-white",
                  )}
                >
                  {message}
                </motion.h2>
              </div>

              {/* Player Hand */}
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex items-center justify-center gap-2">
                  <AnimatePresence>
                    {playerHand.map((card, i) => (
                      <BlackjackCard key={`player-${i}-${card.id}`} card={card} />
                    ))}
                  </AnimatePresence>
                  {playerHand.length === 0 && (
                    <div className="w-24 sm:w-28 md:w-32 rounded-lg border-2 border-dashed border-white/10 aspect-square" />
                  )}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Your Momentum</span>
                  {gameState !== "idle" && (
                    <div
                      className={cn(
                        "flex items-center justify-center h-8 px-4 rounded-full text-sm font-black text-white border",
                        playerTotal > BUST_THRESHOLD ? "bg-red-500/20 border-red-500/50" : "bg-primary/20 border-primary/50",
                      )}
                    >
                      <span className={cn(playerTotal > BUST_THRESHOLD ? "text-red-400" : "text-primary")}>{playerTotal}</span>
                      <span className="mx-1 text-white/40">/</span>
                      <span className="text-white/40 text-xs">{BUST_THRESHOLD}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 flex w-full max-w-md items-center justify-center gap-4 flex-shrink-0">
                {gameState === "idle" && (
                  <Button
                    onClick={startGame}
                    disabled={isProcessing}
                    className="h-14 w-48 rounded-full bg-primary text-lg font-black uppercase tracking-tight text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] transition-all"
                  >
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "PLAY"}
                  </Button>
                )}

                {gameState === "playing" && (
                  <div className="flex gap-4">
                    <Button
                      onClick={hit}
                      className="h-14 w-24 rounded-2xl bg-secondary text-lg font-black uppercase tracking-tight text-white hover:bg-secondary/90 hover:shadow-[0_0_20px_rgba(255,92,147,0.4)] sm:w-32"
                    >
                      HIT
                    </Button>
                    <Button
                      onClick={stand}
                      variant="outline"
                      className="h-14 w-24 rounded-2xl border-white/20 text-lg font-black uppercase tracking-tight text-white hover:bg-white/5 sm:w-32 bg-transparent"
                    >
                      STAND
                    </Button>
                  </div>
                )}

                {gameState === "resolved" && (
                  <Button
                    onClick={reset}
                    className="group flex h-14 items-center gap-3 rounded-full bg-white px-8 text-lg font-black uppercase tracking-tight text-black hover:bg-white/90"
                  >
                    PLAY AGAIN
                    <RefreshCcw className="h-5 w-5 transition-transform group-hover:rotate-180" />
                  </Button>
                )}
              </div>
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
                      gameState === "resolved" && winResult === "win"
                        ? "shadow-[0_0_40px_rgba(0,255,157,0.5)]"
                        : gameState === "resolved" && (winResult === "lose" || winResult === "bust")
                        ? "shadow-[0_0_40px_rgba(255,92,147,0.5)]"
                        : "shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    )}
                  >
                    <MusicCard card={stakedCard} showDelete={false} />

                    {/* Status Badge Overlay */}
                    {gameState === "resolved" && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={cn(
                          "absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-black uppercase",
                          winResult === "win"
                            ? "bg-primary text-black shadow-[0_0_20px_rgba(0,255,157,0.6)]"
                            : winResult === "push"
                            ? "bg-white/20 text-white shadow-lg"
                            : "bg-secondary text-white shadow-lg"
                        )}
                      >
                        {winResult === "win" ? "SAVED" : winResult === "push" ? "RETURNED" : "LOST"}
                      </motion.div>
                    )}

                    {/* Loss Overlay */}
                    {gameState === "resolved" && (winResult === "lose" || winResult === "bust") && (
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
                        Press PLAY to stake a random card
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
                  A random card from your collection will be put at risk. Win to keep it!
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
              gameState === "resolved" && winResult === "win"
                ? "shadow-[0_0_20px_rgba(0,255,157,0.5)]"
                : gameState === "resolved" && (winResult === "lose" || winResult === "bust")
                ? "shadow-[0_0_20px_rgba(255,92,147,0.5)]"
                : ""
            )}
          >
            <MusicCard card={stakedCard} showDelete={false} />
            {gameState === "resolved" && (
              <div className={cn(
                "absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[7px] font-black uppercase",
                winResult === "win" ? "bg-primary text-black" : winResult === "push" ? "bg-white/20 text-white" : "bg-secondary text-white"
              )}>
                {winResult === "win" ? "✓" : winResult === "push" ? "=" : "✗"}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  )
}
