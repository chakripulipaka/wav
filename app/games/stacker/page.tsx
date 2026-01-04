"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { MusicCard } from "@/components/music-card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Play, Sparkles, HelpCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { cardsApi, blackjackApi } from "@/lib/api"
import type { CardDisplay } from "@/lib/types"
import type { BlackjackGameCard } from "@/lib/blackjack-utils"

// Constants for the game
const GRID_WIDTH = 7
const GRID_HEIGHT = 10

type Difficulty = "EASY" | "MEDIUM" | "HARD"

const DIFFICULTY_SETTINGS = {
  EASY: { initialSpeed: 300, speedDecrement: 15 },
  MEDIUM: { initialSpeed: 180, speedDecrement: 12 },
  HARD: { initialSpeed: 110, speedDecrement: 10 },
}

// Card reward based on level and difficulty
function getCardReward(level: number, difficulty: Difficulty): number {
  if (level === 1) return 0
  if (level >= 2 && level <= 5) {
    return difficulty === "EASY" ? 1 : 2
  }
  if (level >= 6 && level <= 9) {
    return difficulty === "EASY" ? 2 : difficulty === "MEDIUM" ? 3 : 4
  }
  if (level === 10) {
    return difficulty === "EASY" ? 4 : difficulty === "MEDIUM" ? 6 : 8
  }
  return 0
}

type GameStatus = "idle" | "playing" | "gameover" | "win"

export default function StackerPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()

  const [status, setStatus] = useState<GameStatus>("idle")
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM")
  const [currentRow, setCurrentRow] = useState(0)
  const [currentPos, setCurrentPos] = useState(0)
  const [currentWidth, setCurrentWidth] = useState(3)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [stackedBlocks, setStackedBlocks] = useState<boolean[][]>(
    Array(GRID_HEIGHT)
      .fill(null)
      .map(() => Array(GRID_WIDTH).fill(false)),
  )
  const [message, setMessage] = useState("STACK THE BLOCKS")

  // Card system
  const [deck, setDeck] = useState<BlackjackGameCard[]>([])
  const [userCards, setUserCards] = useState<CardDisplay[]>([])
  const [stakedCard, setStakedCard] = useState<CardDisplay | null>(null)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [wonCards, setWonCards] = useState<BlackjackGameCard[]>([])
  const [cardsWonCount, setCardsWonCount] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

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

      const deckResult = await blackjackApi.getDeck()
      if (deckResult.data && deckResult.data.deck.length > 0) {
        setDeck(deckResult.data.deck)
      }

      const userCardsResult = await cardsApi.getUserCards(user.id)
      if (userCardsResult.data) {
        setUserCards(userCardsResult.data)
      }

      setIsLoadingCards(false)
    }
    fetchCards()
  }, [user])

  // Pick a random card from user's collection to stake
  const pickRandomStakedCard = useCallback(() => {
    if (userCards.length === 0) return null
    const randomIndex = Math.floor(Math.random() * userCards.length)
    return userCards[randomIndex]
  }, [userCards])

  // Start the game
  const startGame = () => {
    if (deck.length === 0 || userCards.length === 0) return

    // Pick a random card to stake
    const cardToStake = pickRandomStakedCard()
    if (!cardToStake) return
    setStakedCard(cardToStake)

    setStatus("playing")
    setWonCards([])
    setCardsWonCount(0)
    setCurrentRow(0)
    const startWidth = 3
    const startPos = Math.floor(Math.random() * (GRID_WIDTH - startWidth + 1))
    setCurrentPos(startPos)
    setCurrentWidth(startWidth)
    setStackedBlocks(
      Array(GRID_HEIGHT)
        .fill(null)
        .map(() => Array(GRID_WIDTH).fill(false)),
    )
    setMessage("TAP TO STACK")
  }

  // Move the blocks in the current row
  const moveBlocks = useCallback(() => {
    setCurrentPos((prev) => {
      const nextPos = prev + direction
      if (nextPos + currentWidth > GRID_WIDTH) {
        setDirection(-1)
        return prev - 1
      }
      if (nextPos < 0) {
        setDirection(1)
        return prev + 1
      }
      return nextPos
    })
  }, [direction, currentWidth])

  // Game loop handle
  useEffect(() => {
    if (status === "playing") {
      const settings = DIFFICULTY_SETTINGS[difficulty]
      const speed = Math.max(40, settings.initialSpeed - currentRow * settings.speedDecrement)
      gameLoopRef.current = setInterval(moveBlocks, speed)
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [status, currentRow, moveBlocks, difficulty])

  // Handle the "Stack" action
  const handleStack = useCallback(async () => {
    if (status !== "playing") return

    const newStacked = [...stackedBlocks]
    const rowIdx = GRID_HEIGHT - 1 - currentRow

    // Determine the overlapping blocks
    let overlapStart = currentPos
    let overlapEnd = currentPos + currentWidth - 1

    if (currentRow > 0) {
      const prevRowIdx = GRID_HEIGHT - 1 - (currentRow - 1)
      const prevRow = newStacked[prevRowIdx]

      // Calculate overlap with previous row
      const actualStart = Math.max(overlapStart, prevRow.indexOf(true))
      const actualEnd = Math.min(overlapEnd, prevRow.lastIndexOf(true))

      if (actualStart > actualEnd) {
        // Game Over - No overlap
        setStatus("gameover")
        setMessage("GAME OVER")
        setIsProcessing(true)

        try {
          const level = currentRow + 1
          const cardsToWin = getCardReward(level, difficulty)
          setCardsWonCount(cardsToWin)

          if (cardsToWin > 0) {
            // Randomly select cards from deck
            const selectedCards = []
            for (let i = 0; i < cardsToWin && i < deck.length; i++) {
              const randomIndex = Math.floor(Math.random() * deck.length)
              selectedCards.push(deck[randomIndex])
            }
            setWonCards(selectedCards)

            // Claim the won cards
            const cardsToAdd = selectedCards.map(card => ({
              id: card.id,
              song_name: card.song_name,
              artist_name: card.artist_name,
              album_art_url: card.album_art_url,
              momentum: card.momentum,
            }))
            await blackjackApi.claimCards(cardsToAdd)
          }

          // Remove staked card
          if (user && stakedCard) {
            await blackjackApi.removeCard(user.id, stakedCard.id)
            setUserCards(prev => prev.filter(c => c.id !== stakedCard.id))
          }
        } catch (error) {
          console.error("Error processing game over:", error)
        } finally {
          setIsProcessing(false)
        }
        return
      }

      overlapStart = actualStart
      overlapEnd = actualEnd
    }

    // Place the current row's blocks
    for (let i = overlapStart; i <= overlapEnd; i++) {
      newStacked[rowIdx][i] = true
    }

    setStackedBlocks(newStacked)
    const newWidth = overlapEnd - overlapStart + 1
    setCurrentWidth(newWidth)

    if (currentRow === GRID_HEIGHT - 1) {
      // Win! Reached level 10
      setStatus("win")
      setMessage("ELITE STACKER!")
      setIsProcessing(true)

      try {
        const cardsToWin = getCardReward(10, difficulty)
        setCardsWonCount(cardsToWin)

        // Randomly select cards from deck
        const selectedCards = []
        for (let i = 0; i < cardsToWin && i < deck.length; i++) {
          const randomIndex = Math.floor(Math.random() * deck.length)
          selectedCards.push(deck[randomIndex])
        }
        setWonCards(selectedCards)

        // Claim the won cards
        const cardsToAdd = selectedCards.map(card => ({
          id: card.id,
          song_name: card.song_name,
          artist_name: card.artist_name,
          album_art_url: card.album_art_url,
          momentum: card.momentum,
        }))
        await blackjackApi.claimCards(cardsToAdd)

        // Keep staked card (don't remove on win)
      } catch (error) {
        console.error("Error processing win:", error)
      } finally {
        setIsProcessing(false)
      }
    } else {
      setCurrentRow((prev) => prev + 1)
      const nextPos = Math.floor(Math.random() * (GRID_WIDTH - newWidth + 1))
      setCurrentPos(nextPos)
      setDirection(Math.random() > 0.5 ? 1 : -1)
    }
  }, [status, currentRow, currentPos, currentWidth, stackedBlocks, difficulty, deck, user, stakedCard])

  // Handle keyboard interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        if (status === "playing") handleStack()
        else if (status === "idle" || status === "gameover" || status === "win") startGame()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [status, handleStack])

  const reset = () => {
    setStakedCard(null)
    setWonCards([])
    setCardsWonCount(0)
    setStatus("idle")
    setMessage("STACK THE BLOCKS")
  }

  // Show loading state
  if (authLoading || isLoadingCards) {
    return (
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden text-white font-sans">
        <Navigation />

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,#1DB954_1px,transparent_1px),linear-gradient(to_bottom,#1DB954_1px,transparent_1px)] [background-size:20px_20px]" />
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
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden text-white font-sans">
        <Navigation />

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,#1DB954_1px,transparent_1px),linear-gradient(to_bottom,#1DB954_1px,transparent_1px)] [background-size:20px_20px]" />
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
      <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden text-white font-sans">
        <Navigation />

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <div className="h-full w-full bg-[linear-gradient(to_right,#1DB954_1px,transparent_1px),linear-gradient(to_bottom,#1DB954_1px,transparent_1px)] [background-size:20px_20px]" />
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
    <main className="fixed inset-0 flex flex-col bg-[#0a0a0a] overflow-hidden text-white font-sans">
      <Navigation />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,#1DB954_1px,transparent_1px),linear-gradient(to_bottom,#1DB954_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="container relative z-10 flex flex-1 flex-col px-4 pt-24 pb-8">
        {/* Top Header */}
        <div className="mb-6 flex w-full max-w-lg items-center justify-between mx-auto">
          <Link
            href="/games"
            className="flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <HelpCircle className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-white">INSTRUCTIONS</span>
            </button>
          </div>
        </div>

        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setShowInstructions(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-md mx-4 rounded-2xl bg-[#111] border border-white/10 p-6"
              >
                <h3 className="text-xl font-black mb-4 text-primary">HOW TO PLAY</h3>
                <div className="space-y-3 text-sm text-white/80">
                  <p>Stack blocks to build a tower. Each block must overlap the one below it.</p>
                  <p className="font-bold text-white">Card Rewards by Level:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <span className="text-white/60">Level 1:</span> No cards</li>
                    <li>• <span className="text-white/60">Level 2-5:</span> Easy: 1 card, Medium/Hard: 2 cards</li>
                    <li>• <span className="text-white/60">Level 6-9:</span> Easy: 2, Medium: 3, Hard: 4 cards</li>
                    <li>• <span className="text-white/60">Level 10 (Win):</span> Easy: 4, Medium: 6, Hard: 8 cards</li>
                  </ul>
                  <p className="text-secondary font-bold">Lose: Your staked card is lost</p>
                  <p className="text-primary font-bold">Win: Keep your staked card + bonus cards!</p>
                </div>
                <Button onClick={() => setShowInstructions(false)} className="w-full mt-4 bg-primary text-black font-black">
                  GOT IT
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Centered phone layout */}
        <div className="flex flex-1 items-center justify-center">
          {/* Phone cabinet - centered */}
          <div className="flex flex-col items-center">
            {/* Stacker Arcade Cabinet */}
            <div className="relative w-[500px] overflow-hidden rounded-[3rem] border-[12px] border-[#1a1a1a] bg-[#111] shadow-[0_0_100px_rgba(29,185,84,0.15)] ring-4 ring-white/5">
              {/* Header Marquee */}
              <div className="flex h-16 items-center justify-center border-b-8 border-[#1a1a1a] bg-[#0d0d0d]">
                <h1 className="text-2xl font-black italic tracking-[0.2em] text-primary drop-shadow-[0_0_8px_rgba(29,185,84,0.8)]">
                  STACKER
                </h1>
              </div>

              {/* Game Display Area */}
              <div className="relative aspect-[3/4] p-4 bg-black">
                {/* The Grid */}
                <div className="grid h-full w-full grid-cols-7 grid-rows-10 gap-1.5">
                  {Array.from({ length: GRID_HEIGHT }).map((_, rowIdx) =>
                    Array.from({ length: GRID_WIDTH }).map((_, colIdx) => {
                      const isStacked = stackedBlocks[rowIdx][colIdx]
                      const isCurrent =
                        GRID_HEIGHT - 1 - currentRow === rowIdx &&
                        colIdx >= currentPos &&
                        colIdx < currentPos + currentWidth &&
                        status === "playing"

                      return (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className={cn(
                            "rounded-[2px] border transition-all duration-150",
                            isStacked
                              ? "bg-primary border-primary/50 shadow-[0_0_10px_rgba(29,185,84,0.8)]"
                              : isCurrent
                                ? "bg-secondary border-secondary/50 shadow-[0_0_15px_rgba(255,64,129,0.8)]"
                                : "bg-white/5 border-white/5",
                          )}
                        />
                      )
                    }),
                  )}
                </div>

                {/* Overlays */}
                <AnimatePresence>
                  {(status === "idle" || status === "gameover" || status === "win") && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 text-center"
                    >
                      <div className="mb-4 w-full rounded-2xl bg-white/5 p-4 border border-white/10">
                        <Trophy
                          className={cn("h-10 w-10 mx-auto mb-2", status === "win" ? "text-primary" : "text-white/20")}
                        />
                        <h2 className="text-xl font-black tracking-tighter uppercase">{message}</h2>

                        {status !== "playing" && (
                          <div className="mt-4 flex flex-col gap-2">
                            <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                              Select Difficulty
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {(["EASY", "MEDIUM", "HARD"] as Difficulty[]).map((d) => (
                                <button
                                  key={d}
                                  onClick={() => setDifficulty(d)}
                                  className={cn(
                                    "rounded-lg py-2 text-[10px] font-black transition-all",
                                    difficulty === d
                                      ? "bg-primary text-black"
                                      : "bg-white/5 text-white/40 hover:bg-white/10",
                                  )}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {(status === "gameover" || status === "win") && cardsWonCount > 0 && (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-4 rounded-xl bg-primary/10 p-3 border border-primary/20"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-[10px] font-black text-primary uppercase">
                                +{cardsWonCount} Cards Won!
                              </span>
                            </div>

                            {/* Display won cards */}
                            {wonCards.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {wonCards.map((card, idx) => (
                                  <div
                                    key={`${card.id}-${idx}`}
                                    className="flex items-center gap-2 bg-black/20 rounded-lg p-2"
                                  >
                                    <img
                                      src={card.album_art_url || "/placeholder.svg"}
                                      alt={card.song_name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] font-bold truncate text-white">
                                        {card.song_name}
                                      </p>
                                      <p className="text-[8px] text-primary font-bold">
                                        +{card.momentum}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {status === "gameover" && cardsWonCount === 0 && (
                          <p className="mt-4 text-xs text-white/60">Reach level 2 to earn cards</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 w-full max-w-[200px]">
                        <Button
                          onClick={status === "idle" ? startGame : reset}
                          disabled={isProcessing}
                          className="h-12 rounded-xl bg-primary text-black font-black hover:bg-primary/90"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              {status === "idle" ? "START GAME" : "PLAY AGAIN"}
                              {!isProcessing && <Play className="ml-2 h-4 w-4 fill-current" />}
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Controller Area */}
              <div className="flex h-32 flex-col items-center justify-center gap-4 bg-[#0d0d0d] p-4">
                <button
                  onClick={status === "playing" ? handleStack : status !== "playing" ? startGame : undefined}
                  disabled={isProcessing}
                  className={cn(
                    "group relative h-16 w-16 rounded-full transition-all active:scale-95",
                    status === "playing" ? "bg-secondary shadow-[0_0_25px_rgba(255,64,129,0.5)]" : "bg-white/10 grayscale",
                  )}
                >
                  <div className="absolute inset-2 rounded-full border-2 border-white/20" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 to-transparent" />
                </button>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                  SPACE OR CLICK TO STACK
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Level Stats - fixed positioned BOTTOM RIGHT */}
      <div className="hidden lg:flex fixed bottom-8 right-8 z-10 gap-4">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 w-36">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Row</div>
          <div className="text-2xl font-black italic">
            {currentRow + 1}
            <span className="text-white/20 ml-1 text-sm font-normal">/10</span>
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 p-4 border border-white/10 w-36">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Block Width</div>
          <div className="text-2xl font-black italic">{currentWidth}</div>
        </div>
      </div>

      {/* Card at stake - fixed positioned right of center */}
      <div className="hidden lg:block fixed top-1/2 -translate-y-1/2 z-10 left-[calc(50%+310px)]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col items-center gap-4"
        >
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Card at Stake
              </span>

              <div className="relative w-40 xl:w-48">
                {stakedCard ? (
                  <motion.div
                    key={stakedCard.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={cn(
                      "relative rounded-2xl",
                      status === "win"
                        ? "shadow-[0_0_40px_rgba(0,255,157,0.5)]"
                        : status === "gameover"
                        ? "shadow-[0_0_40px_rgba(255,92,147,0.5)]"
                        : "shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    )}
                  >
                    <MusicCard card={stakedCard} showDelete={false} />

                    {(status === "win" || status === "gameover") && (
                      <motion.div
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className={cn(
                          "absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-xs font-black uppercase",
                          status === "win"
                            ? "bg-primary text-black"
                            : "bg-secondary text-white"
                        )}
                      >
                        {status === "win" ? "SAVED" : "LOST"}
                      </motion.div>
                    )}

                    {status === "gameover" && (
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
                        Press START GAME to stake a random card
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {status === "idle" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] text-center text-white/30 max-w-[180px] leading-relaxed"
                >
                  Win to keep your card + earn bonus cards. Lose and it's gone!
                </motion.p>
              )}
            </motion.div>
      </div>

      {/* Mobile Staked Card */}
      {stakedCard && (
        <div className="lg:hidden fixed bottom-4 right-4 z-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "relative w-28 rounded-xl",
              status === "win"
                ? "shadow-[0_0_20px_rgba(0,255,157,0.5)]"
                : status === "gameover"
                ? "shadow-[0_0_20px_rgba(255,92,147,0.5)]"
                : ""
            )}
          >
            <MusicCard card={stakedCard} showDelete={false} />
            {(status === "win" || status === "gameover") && (
              <div className={cn(
                "absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[7px] font-black uppercase",
                status === "win" ? "bg-primary text-black" : "bg-secondary text-white"
              )}>
                {status === "win" ? "✓" : "✗"}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </main>
  )
}
