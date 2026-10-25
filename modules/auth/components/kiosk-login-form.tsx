"use client"

import { useKioskLogin } from "../hooks/use-kiosk-login"
import { KioskExitModal } from "./kiosk-exit-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Loader2 } from "lucide-react"

export function KioskLoginForm({ tenantSlug }: { tenantSlug: string }) {
  const { form, onSubmit, isSubmitting, error } = useKioskLogin(tenantSlug)

  const handleNumpadClick = (num: string) => {
    const currentPin = form.getValues("pin") || ""
    form.setValue("pin", currentPin + num)
  }

  const handleBackspace = () => {
    const currentPin = form.getValues("pin") || ""
    form.setValue("pin", currentPin.slice(0, -1))
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center justify-center space-y-6 rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
      <div className="space-y-1 text-center">
        <h2 className="font-display text-2xl font-light text-foreground">
          Masuk Kiosk
        </h2>
        <p className="text-sm font-light text-muted-foreground">
          Masukkan username dan PIN terapis Anda
        </p>
      </div>

      <form onSubmit={onSubmit} className="w-full space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="kiosk-username"
            className="text-xs tracking-widest text-muted-foreground uppercase"
          >
            Username
          </Label>
          <Input
            id="kiosk-username"
            placeholder="e.g. johndoe"
            {...form.register("username")}
            className="rounded-xl border-border/50 bg-muted/20 py-5 text-center text-lg"
          />
          {form.formState.errors.username && (
            <p className="text-center text-sm text-destructive">
              {form.formState.errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="kiosk-pin"
            className="text-xs tracking-widest text-muted-foreground uppercase"
          >
            PIN
          </Label>
          <Input
            id="kiosk-pin"
            type="password"
            placeholder="••••••"
            readOnly
            {...form.register("pin")}
            className="rounded-xl border-border/50 bg-muted/20 py-5 text-center text-2xl tracking-[0.5em]"
          />
          {form.formState.errors.pin && (
            <p className="text-center text-sm text-destructive">
              {form.formState.errors.pin.message}
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              className="h-14 rounded-xl border border-border/50 text-xl font-light hover:bg-muted/50"
              onClick={() => handleNumpadClick(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-xl border border-border/50 text-xl font-light text-muted-foreground hover:bg-muted/50"
            onClick={handleBackspace}
          >
            ⌫
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-xl border border-border/50 text-xl font-light hover:bg-muted/50"
            onClick={() => handleNumpadClick("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14 rounded-xl border border-border/50 text-xl font-light text-muted-foreground hover:bg-muted/50"
            onClick={() => form.setValue("pin", "")}
          >
            C
          </Button>
        </div>

        <Button
          type="submit"
          className="mt-2 h-12 w-full rounded-full text-sm font-medium tracking-[0.1em] uppercase"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              MEMVERIFIKASI...
            </>
          ) : (
            "MASUK KIOSK"
          )}
        </Button>
      </form>

      <div className="w-full border-t border-border/50 pt-2 text-center">
        <KioskExitModal
          tenantSlug={tenantSlug}
          trigger={
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Keluar Mode Kiosk (Kembali ke POS)
            </Button>
          }
        />
      </div>
    </div>
  )
}
