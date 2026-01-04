"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth, useRequireAuth } from "@/contexts/AuthContext"
import { usersApi } from "@/lib/api"
import { GenreSelector } from "@/components/genre-selector"
import { ArtistSelector } from "@/components/artist-selector"
import { ArtistPreference } from "@/lib/types"

export default function ProfilePage() {
  const { user } = useRequireAuth()
  const { logout, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    deckPrivacy: user?.deck_privacy || "public",
    tradePrivacy: user?.trade_privacy || "public",
  })

  // Preference state
  const [topGenres, setTopGenres] = useState<string[]>(user?.top_genres || [])
  const [topArtists, setTopArtists] = useState<ArtistPreference[]>(user?.top_artists || [])
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [preferencesSaved, setPreferencesSaved] = useState(false)

  // Update preferences when user changes
  useEffect(() => {
    if (user) {
      setTopGenres(user.top_genres || [])
      setTopArtists(user.top_artists || [])
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    setSaveError(null)

    const result = await usersApi.updateProfile(user.id, {
      deck_privacy: formData.deckPrivacy,
      trade_privacy: formData.tradePrivacy,
    })

    if (result.error) {
      setSaveError(result.error)
      setIsSaving(false)
      return
    }

    // Refresh user data to update the displayed values
    await refreshUser()
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCancel = () => {
    setFormData({
      username: user?.username || "",
      email: user?.email || "",
      deckPrivacy: user?.deck_privacy || "public",
      tradePrivacy: user?.trade_privacy || "public",
    })
    setTopGenres(user?.top_genres || [])
    setTopArtists(user?.top_artists || [])
    setIsEditing(false)
  }

  const handleSavePreferences = async () => {
    if (!user) return

    setIsSavingPreferences(true)
    setPreferencesError(null)
    setPreferencesSaved(false)

    const result = await usersApi.updatePreferences(user.id, {
      top_genres: topGenres,
      top_artists: topArtists,
    })

    if (result.error) {
      setPreferencesError(result.error)
      setIsSavingPreferences(false)
      return
    }

    await refreshUser()
    setIsSavingPreferences(false)
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
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Profile Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account and privacy settings</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-lg border border-border bg-card p-8 space-y-8">
          {/* Profile Picture Section - Only for non-guests */}
          {!user.is_guest && (
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
          )}

          {/* User Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Account Information</h2>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              {user.is_guest ? (
                <p className="px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                  {user.username} (Guest Account - Cannot Edit)
                </p>
              ) : isEditing ? (
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

            {/* Email - Hide for guests */}
            {!user.is_guest && (
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
            )}
          </div>

          {/* Preferences Section */}
          <div className="space-y-6 border-t border-border pt-8">
            <div>
              <h2 className="text-xl font-semibold">Preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize your experience by selecting your favorite genres and artists. Cards you receive will be influenced by these choices.
              </p>
            </div>

            {/* Top Genres */}
            <div>
              <label className="block text-sm font-medium mb-3">Top Genres</label>
              <GenreSelector
                selected={topGenres}
                onChange={setTopGenres}
                disabled={!isEditing}
              />
            </div>

            {/* Top Artists */}
            <div>
              <label className="block text-sm font-medium mb-3">Top Artists</label>
              <ArtistSelector
                selected={topArtists}
                onChange={setTopArtists}
                disabled={!isEditing}
              />
            </div>

            {/* Save Preferences Button (only in edit mode for non-guests) */}
            {isEditing && !user.is_guest && (
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleSavePreferences}
                  disabled={isSavingPreferences}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSavingPreferences ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving Preferences...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>
                {preferencesError && (
                  <p className="text-sm text-destructive">{preferencesError}</p>
                )}
              </div>
            )}
          </div>

          {/* Privacy Settings - Only for non-guests */}
          {!user.is_guest && (
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
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 pt-4">
            {saveError && (
              <p className="text-sm text-destructive text-center">{saveError}</p>
            )}
            {/* For guests, show preferences error */}
            {user.is_guest && preferencesError && (
              <p className="text-sm text-destructive text-center">{preferencesError}</p>
            )}
            <div className="flex flex-col gap-4">
            {user.is_guest ? (
              // Guest buttons - Edit Profile, Logout, and Create Account
              <>
                {/* Top row: Edit Profile + Logout */}
                <div className="flex gap-4 w-full">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSavePreferences}
                        disabled={isSavingPreferences}
                        className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all"
                      >
                        {isSavingPreferences ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Preferences'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditing(false);
                          // Reset preferences to original values
                          setTopGenres(user.top_genres || []);
                          setTopArtists(user.top_artists || []);
                        }}
                        disabled={isSavingPreferences}
                        variant="outline"
                        className="flex-1 bg-transparent hover:shadow-[0_0_20px_rgba(255,92,147,0.25)] transition-all"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] transition-all"
                      >
                        Edit Profile
                      </Button>
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="flex-1 bg-transparent hover:shadow-[0_0_20px_rgba(255,92,147,0.25)] transition-all"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  )}
                </div>

                {/* Bottom row: Create Account (full width) */}
                {!isEditing && (
                  <Link href="/login?mode=signup" className="w-full">
                    <Button className="w-full bg-secondary hover:bg-secondary/90 hover:shadow-[0_0_20px_rgba(255,92,147,0.4)] transition-all">
                      Create Account
                    </Button>
                  </Link>
                )}
              </>
            ) : isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
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
    </div>
  )
}
