"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ArrowLeftRight, BarChart3, Package, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navigation() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  const navItems = [
    { href: "/deck", label: "My WAV", icon: LayoutDashboard },
    { href: "/games", label: "Games", icon: Package },
    { href: "/trade", label: "Trade", icon: ArrowLeftRight },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ]

  const username = user?.username || "User"
  const firstLetter = username.charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href={isAuthenticated ? "/deck" : "/"} className="flex items-center gap-3 flex-shrink-0 transition-all hover:shadow-[0_0_15px_rgba(255,92,147,0.3)]">
          <div className="flex items-center gap-0 text-lg font-bold">
            <span className="text-white">W</span>
            <span className="text-primary">AV</span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            const isAnalytics = item.href === "/analytics"

            // Special handling for Analytics link - force full reload when clicked while already on analytics
            const handleClick = (e: React.MouseEvent) => {
              if (isAnalytics && pathname === "/analytics") {
                e.preventDefault()
                window.location.href = "/analytics"
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-[0_0_15px_rgba(255,92,147,0.25)]",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 hover:shadow-[0_0_15px_rgba(255,92,147,0.4)] transition-all flex-shrink-0 overflow-hidden"
              title={username}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={username} className="h-full w-full object-cover" />
              ) : (
                firstLetter
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{username}</p>
              {user?.email && !user?.is_guest && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
              {user?.is_guest && (
                <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-secondary/10 rounded-full text-xs font-medium text-secondary">
                  Guest Mode
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            {user?.is_guest && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/login?mode=signup" className="cursor-pointer text-primary">
                    Create Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
