"use client"

import { useLogin } from "@/modules/auth/hooks/use-login"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  const { form, onSubmit, isSubmitting, errorMessage } = useLogin()

  return (
    <Card className="w-full max-w-sm shadow-xl border-t-4 border-t-primary">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Login</CardTitle>
        <CardDescription>
          Enter your email and password to sign in.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@okgo.com"
              autoComplete="email"
              className="transition-colors hover:border-primary/50 focus:border-primary"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm font-medium text-destructive mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="transition-colors hover:border-primary/50 focus:border-primary"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm font-medium text-destructive mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {errorMessage && (
            <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
              {errorMessage}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full font-semibold mt-4"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
