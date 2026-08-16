"use client"

import { useKioskLogin } from "../hooks/use-kiosk-login"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm mx-auto p-6 bg-card rounded-xl shadow-lg border">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Staff Login</h2>
        <p className="text-muted-foreground text-sm">Enter your username and PIN to continue</p>
      </div>

      <form onSubmit={onSubmit} className="w-full space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            placeholder="e.g. johndoe"
            {...form.register("username")}
            className="text-center text-lg py-6"
          />
          {form.formState.errors.username && (
            <p className="text-red-500 text-sm text-center">{form.formState.errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            type="password"
            placeholder="••••••"
            readOnly
            {...form.register("pin")}
            className="text-center text-2xl tracking-[0.5em] py-6"
          />
          {form.formState.errors.pin && (
            <p className="text-red-500 text-sm text-center">{form.formState.errors.pin.message}</p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              type="button"
              variant="outline"
              className="h-16 text-xl"
              onClick={() => handleNumpadClick(num.toString())}
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-16 text-xl"
            onClick={handleBackspace}
          >
            ⌫
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-16 text-xl"
            onClick={() => handleNumpadClick("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-16 text-xl"
            onClick={() => form.setValue("pin", "")}
          >
            C
          </Button>
        </div>

        <Button type="submit" className="w-full h-12 text-lg" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Login"}
        </Button>
      </form>
    </div>
  )
}
