"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, LogOut } from "lucide-react"
import Link from "next/link"

// Mock user data - in production this would come from the database/session
const mockUser = {
  username: "MusicLover123",
  email: "user@example.com",
  profileImage: null,
  deckPrivacy: "public",
  tradePrivacy: "public",
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    deckPrivacy: user.deckPrivacy,
    tradePrivacy: user.tradePrivacy,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    setUser({
      ...user,
      username: formData.username,
      email: formData.email,
      deckPrivacy: formData.deckPrivacy,
      tradePrivacy: formData.tradePrivacy,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      username: user.username,
      email: user.email,
      deckPrivacy: user.deckPrivacy,
      tradePrivacy: user.tradePrivacy,
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen">
      <Navigation username={user.username} />

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Back Button */}
        <Link href="/deck" className="inline-flex items-center gap-2 text-primary hover:opacity-80 mb-8">
          <ArrowLeft className="h-5 w-5" />
          Back to My WAV
        </Link>

        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Profile Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account and privacy settings</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-lg border border-border bg-card p-8 space-y-8">
          {/* Profile Picture Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              {isEditing && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Upload className="h-4 w-4" />
                  Change Picture
                </button>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Account Information</h2>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              {isEditing ? (
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-background border-border"
                  placeholder="Enter username"
                />
              ) : (
                <p className="px-4 py-2 rounded-lg bg-muted text-foreground">{user.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-background border-border"
                  placeholder="Enter email"
                />
              ) : (
                <p className="px-4 py-2 rounded-lg bg-muted text-foreground">{user.email}</p>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-6 border-t border-border pt-8">
            <h2 className="text-xl font-semibold">Privacy Settings</h2>

            {/* WAV Deck Privacy */}
            <div>
              <label className="block text-sm font-medium mb-2">WAV Deck Visibility</label>
              {isEditing ? (
                <select
                  name="deckPrivacy"
                  value={formData.deckPrivacy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground"
                >
                  <option value="public">Public - Everyone can view</option>
                  <option value="private">Private - Only you can view</option>
                </select>
              ) : (
                <p className="px-4 py-2 rounded-lg bg-muted text-foreground capitalize">
                  {user.deckPrivacy === "public" ? "Public - Everyone can view" : "Private - Only you can view"}
                </p>
              )}
            </div>

            {/* Trades Privacy */}
            <div>
              <label className="block text-sm font-medium mb-2">Trades Visibility</label>
              {isEditing ? (
                <select
                  name="tradePrivacy"
                  value={formData.tradePrivacy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border text-foreground"
                >
                  <option value="public">Public - Everyone can view</option>
                  <option value="private">Private - Only you can view</option>
                </select>
              ) : (
                <p className="px-4 py-2 rounded-lg bg-muted text-foreground capitalize">
                  {user.tradePrivacy === "public" ? "Public - Everyone can view" : "Private - Only you can view"}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)} className="flex-1 bg-primary hover:bg-primary/90">
                  Edit Profile
                </Button>
                <Button onClick={handleLogout} variant="outline" className="flex-1 bg-transparent">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
