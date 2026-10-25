"use client"

import { useState } from "react"
import { Lock, Loader2 } from "lucide-react"
import { useExitToPos } from "../hooks/use-exit-to-pos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function KioskExitModal({ tenantSlug }: { tenantSlug: string }) {
  const [open, setOpen] = useState(false)
  const { form, onSubmit, isSubmitting, error, reset } = useExitToPos(
    tenantSlug,
    () => {
      setOpen(false)
    }
  )

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 bottom-4 opacity-50 hover:opacity-100"
        >
          <Lock className="h-5 w-5" />
          <span className="sr-only">Exit Kiosk</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="overflow-hidden rounded-2xl border border-border/50 bg-background p-0 shadow-lg sm:max-w-md">
        <div className="flex flex-col items-center p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border/50 bg-muted/30 text-foreground">
            <Lock className="h-8 w-8 stroke-1" />
          </div>

          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="mb-1 font-display text-2xl font-light text-foreground">
              Otorisasi Keluar Kiosk
            </DialogTitle>
            <DialogDescription className="text-sm font-light text-muted-foreground">
              Masukkan email dan kata sandi staf Anda untuk kembali ke POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="kiosk-exit-email"
                className="text-xs tracking-widest text-muted-foreground uppercase"
              >
                Email
              </Label>
              <Input
                id="kiosk-exit-email"
                type="email"
                placeholder="nama@okgo.com"
                autoComplete="email"
                className="rounded-xl border-border/50 bg-muted/20"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="kiosk-exit-password"
                className="text-xs tracking-widest text-muted-foreground uppercase"
              >
                Kata Sandi
              </Label>
              <Input
                id="kiosk-exit-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="rounded-xl border-border/50 bg-muted/20"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="mt-4 h-12 w-full rounded-full text-sm font-medium tracking-[0.1em] uppercase"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  MEMVERIFIKASI...
                </>
              ) : (
                "KEMBALI KE POS"
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
