"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Lock, ChevronLeft, Loader2 } from "lucide-react"
import { kioskLoginSchema, type KioskLoginInput } from "@/modules/auth/schemas/kiosk-schema"
import { verifyKioskPinAction } from "@/modules/auth/actions/kiosk-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ExitReviewsModal({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<KioskLoginInput>({
    resolver: zodResolver(kioskLoginSchema),
    defaultValues: { username: "", pin: "" },
  })

  async function onSubmit(values: KioskLoginInput) {
    setError(null)
    const result = await verifyKioskPinAction(values)

    if (result.error) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success("Otorisasi berhasil.")
      setIsOpen(false)
      form.reset()
      router.push(`/${tenantSlug}/pos`)
    }
  }

  const handleNumpadClick = (num: string) => {
    const currentPin = form.getValues("pin") || ""
    form.setValue("pin", currentPin + num)
  }

  const handleBackspace = () => {
    const currentPin = form.getValues("pin") || ""
    form.setValue("pin", currentPin.slice(0, -1))
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
      setError(null)
    }
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group focus:outline-none">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Keluar
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-lg">
        <div className="p-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-muted/30 border border-border/50 rounded-full flex items-center justify-center mb-6 text-foreground">
            <Lock className="w-8 h-8 stroke-1" />
          </div>

          <DialogHeader className="text-center mb-8">
            <DialogTitle className="text-2xl font-display font-light text-foreground mb-1">Otorisasi Staf</DialogTitle>
            <DialogDescription className="text-muted-foreground font-light text-sm">
              Masukkan Username dan PIN Anda untuk kembali ke POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs text-muted-foreground uppercase tracking-widest">Username</Label>
              <Input
                id="username"
                placeholder="e.g. johndoe"
                {...form.register("username")}
                className="text-center text-lg py-6 bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
              />
              {form.formState.errors.username && (
                <p className="text-red-500 text-xs text-center mt-1">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-xs text-muted-foreground uppercase tracking-widest">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="••••••"
                readOnly
                {...form.register("pin")}
                className="text-center text-2xl tracking-[0.5em] py-6 bg-muted/20 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
              />
              {form.formState.errors.pin && (
                <p className="text-red-500 text-xs text-center mt-1">{form.formState.errors.pin.message}</p>
              )}
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50/50 p-2 rounded-lg">{error}</p>}

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="h-14 text-xl font-light rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors active:scale-95"
                  onClick={() => handleNumpadClick(num.toString())}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="h-14 text-xl font-light rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors active:scale-95 text-muted-foreground"
                onClick={handleBackspace}
              >
                ⌫
              </button>
              <button
                type="button"
                className="h-14 text-xl font-light rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors active:scale-95"
                onClick={() => handleNumpadClick("0")}
              >
                0
              </button>
              <button
                type="button"
                className="h-14 text-xl font-light rounded-xl border border-border/50 bg-background hover:bg-muted/50 transition-colors active:scale-95 text-muted-foreground"
                onClick={() => form.setValue("pin", "")}
              >
                C
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-14 text-sm font-medium tracking-[0.1em] uppercase rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  MEMVERIFIKASI...
                </>
              ) : (
                "VERIFIKASI"
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
