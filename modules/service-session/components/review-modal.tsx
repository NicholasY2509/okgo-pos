"use client"

import { useState } from "react"
import { Star, User, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitReviewAction } from "../actions/service-session-action"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function ReviewModal({
  session,
  isOpen,
  onClose,
  tenantSlug
}: {
  session: any | null
  isOpen: boolean
  onClose: () => void
  tenantSlug: string
}) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!session) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Mohon berikan rating terlebih dahulu.")
      return
    }

    setIsSubmitting(true)
    const result = await submitReviewAction(session.id, tenantSlug, rating, comment)

    if (result.error) {
      toast.error(result.error)
      setIsSubmitting(false)
    } else {
      toast.success("Terima kasih atas ulasan Anda!")
      setRating(0)
      setComment("")
      setIsSubmitting(false)
      onClose()
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0)
      setComment("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-lg">
        <div className="p-10 flex flex-col items-center">
          <div className="mb-6 relative">
            {session.staff?.imageUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border border-border/50">
                <img
                  src={session.staff.imageUrl}
                  alt={session.staff.firstName}
                  className="w-full h-full object-cover grayscale opacity-90"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center text-muted-foreground">
                <User size={40} className="stroke-1" />
              </div>
            )}
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-light text-foreground mb-1">Nilai Layanan</h2>
            <p className="text-muted-foreground font-light text-sm tracking-wide">
              Bagaimana pengalaman Anda dengan <span className="font-medium text-primary">{session.staff?.firstName}</span>?
            </p>
          </div>

          <div className="flex justify-center gap-3 mb-10">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={isSubmitting}
                className="focus:outline-none transition-all duration-300 hover:scale-110 active:scale-95 disabled:hover:scale-100 disabled:opacity-50"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={42}
                  strokeWidth={1}
                  className={`transition-colors duration-300 ${star <= (hoverRating || rating)
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground/30"
                    }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-6">
            <Textarea
              placeholder="Bagikan pengalaman Anda (Opsional)"
              className="resize-none h-28 bg-background border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-2xl p-4 font-light text-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />

            <button
              className="w-full h-14 text-sm font-medium tracking-[0.1em] uppercase rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  MENGIRIM...
                </>
              ) : (
                "KIRIM ULASAN"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
