"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface EnergyChipProps {
  value: number
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
}

const CHIP_COLORS: Record<number, string> = {
  100: "from-blue-500 to-blue-700",
  500: "from-purple-500 to-purple-700",
  1000: "from-primary to-green-700",
  2000: "from-secondary to-pink-700",
  5000: "from-yellow-500 to-orange-700",
}

export function EnergyChip({ value, isSelected, onClick, disabled }: EnergyChipProps) {
  const formatValue = (v: number) => (v >= 1000 ? `${v / 1000}K` : v)

  return (
    <motion.button
      whileHover={!disabled ? { y: -5, scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-dashed border-white/20 p-1 transition-all sm:h-16 sm:w-16",
        isSelected && "border-white border-solid scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]",
        disabled && "opacity-50 grayscale cursor-not-allowed",
      )}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br shadow-inner",
          CHIP_COLORS[value] || "from-gray-500 to-gray-700",
        )}
      >
        <div className="flex h-4/5 w-4/5 flex-col items-center justify-center rounded-full border border-white/20 bg-black/20 text-[10px] font-black text-white sm:text-xs">
          <span>{formatValue(value)}</span>
        </div>
      </div>
    </motion.button>
  )
}
