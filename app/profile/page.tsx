"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth, useRequireAuth } from "@/contexts/AuthContext"
import { usersApi } from "@/lib/api"

export default function ProfilePage() {
  const { user } = useRequireAuth()
  const { logout, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    deckPrivacy: user?.deck_privacy || "public",
    tradePrivacy: user?.trade_privacy || "public",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = () => {
    // TODO: Implement profile update API
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      deckPrivacy: user?.deck_privacy || "public",
      tradePrivacy: user?.trade_privacy || "public",
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    const result = await usersApi.uploadAvatar(user.id, file)

    if (result.error) {
      setUploadError(result.error)
    } else {
      // Refresh user data to get new avatar
      await refreshUser()
    }

    setIsUploading(false)

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

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
              {/* Avatar Circle */}
              <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>

              {/* Upload Button - only visible in edit mode */}
              {isEditing && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={triggerFileInput}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-primary font-medium transition-all hover:shadow-[0_0_20px_rgba(255,92,147,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {isUploading ? 'Uploading...' : 'Change Photo'}
                  </button>
                  {uploadError && (
                    <p className="text-sm text-destructive">{uploadError}</p>
                  )}
                </div>
              )}

              {/* Hidden file input - only rendered in edit mode */}
              {isEditing && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
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
                  {user.deck_privacy === "public" ? "Public - Everyone can view" : "Private - Only you can view"}
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
                  {user.trade_privacy === "public" ? "Public - Everyone can view" : "Private - Only you can view"}
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
