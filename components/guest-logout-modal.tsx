"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GuestLogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export function GuestLogoutModal({ isOpen, onClose, onConfirm }: GuestLogoutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border" showCloseButton={false}>
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <DialogTitle className="text-center">Leaving So Soon?</DialogTitle>
          <DialogDescription className="text-center">
            Guest accounts can&apos;t be recovered after logout. All your cards, energy, and progress will be permanently lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-3 mt-2">
          <Button
            onClick={onClose}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Keep Playing
          </Button>
          <Button
            variant="outline"
            onClick={onConfirm}
            className="bg-transparent border-muted-foreground/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            Logout Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
