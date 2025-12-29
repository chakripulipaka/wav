"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ArrowLeftRight, BarChart3, Package } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  username?: string
}

export function Navigation({ username = "User" }: NavigationProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/deck", label: "My WAV", icon: LayoutDashboard },
    { href: "/unbox", label: "Unbox", icon: Package },
    { href: "/trade", label: "Trade", icon: ArrowLeftRight },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ]

  const firstLetter = username.charAt(0).toUpperCase()

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/deck" className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-0 text-lg font-bold">
            <span className="text-white">W</span>
            <span className="text-primary">AV</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity flex-shrink-0"
          title="View Profile"
        >
          {firstLetter}
        </Link>
      </div>
    </nav>
  )
}
