"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface TradeCountdownProps {
  expiresAt: string
  className?: string
}

export function TradeCountdown({ expiresAt, className }: TradeCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now()

      if (remaining <= 0) {
        return "Expired"
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

      return `${hours}h ${minutes}m`
    }

    // Calculate immediately
    setTimeLeft(calculateTimeLeft())

    // Update every minute (more efficient than every second)
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [expiresAt])

  if (!timeLeft) return null

  const isExpired = timeLeft === "Expired"

  return (
    <span className={className}>
      <Clock className="h-3 w-3 inline-block mr-1" />
      {timeLeft}
    </span>
  )
}
