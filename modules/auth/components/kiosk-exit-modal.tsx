"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"

import { kioskExitSchema, type KioskExitInput } from "../schemas/kiosk-schema"
import { exitKioskAction } from "../actions/kiosk-action"
import { loginAction } from "../actions/login-action" // Assuming this exists for manager login

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
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<KioskExitInput>({
    resolver: zodResolver(kioskExitSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: KioskExitInput) {
    setError(null)

    // We attempt to verify the manager's credentials. 
    // Re-using the standard login action to verify authority.
    const result = await loginAction({ ...values, subdomain: tenantSlug })

    // loginAction returns a string on error, otherwise it redirects
    if (typeof result === "string") {
      setError(result)
      toast.error("Invalid Manager Credentials")
      return
    }

    // If manager is verified (which would normally redirect), exit kiosk mode
    await exitKioskAction()
    setOpen(false)
    toast.success("Exited Kiosk Mode")
    router.push(`/${tenantSlug}/pos`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute bottom-4 right-4 opacity-50 hover:opacity-100">
          <Lock className="h-5 w-5" />
          <span className="sr-only">Exit Kiosk</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Override</DialogTitle>
          <DialogDescription>
            Enter manager credentials to exit Kiosk Mode and return to the POS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Manager Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="manager@okgo.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Verifying..." : "Authorize Exit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
