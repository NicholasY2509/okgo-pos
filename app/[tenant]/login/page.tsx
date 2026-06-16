import { LoginForm } from "@/modules/auth/components/login-form"

export const metadata = {
  title: "Login | Okgo POS",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-sky-100 via-background to-background dark:from-sky-900/20" />
      <LoginForm />
    </div>
  )
}
