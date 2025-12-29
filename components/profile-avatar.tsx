"use client"

import Link from "next/link"

interface ProfileAvatarProps {
  username?: string
}

export function ProfileAvatar({ username = "User" }: ProfileAvatarProps) {
  const firstLetter = username.charAt(0).toUpperCase()

  return (
    <Link
      href="/profile"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm hover:opacity-80 transition-opacity"
      title="View Profile"
    >
      {firstLetter}
    </Link>
  )
}
