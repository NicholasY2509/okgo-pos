import { LoginForm } from "@/modules/auth/components/login-form"

export const metadata = {
  title: "Admin Portal | NYENYAK",
  description: "Login to the admin dashboard",
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 relative overflow-hidden p-4 transition-colors duration-300">

      {/* Abstract Glassmorphism Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {/* Colorful Orbs */}
        <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-primary/40 dark:bg-primary/30 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-primary/30 dark:bg-primary/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute -bottom-[10%] left-[30%] w-[500px] h-[500px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      {/* Frosted Glass Overlay on the background */}
      <div className="absolute inset-0 z-0 backdrop-blur-[60px] pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10">

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-5xl font-display text-slate-900 dark:text-white tracking-widest drop-shadow-sm transition-colors duration-300">
            NYENYAK
          </h1>
          <span className="text-primary tracking-widest text-lg uppercase ">
            Admin
          </span>
        </div>

        <div className="w-full relative group flex justify-center">
          {/* Glow behind the form */}
          <div className="absolute inset-0 bg-white/40 dark:bg-white/10 rounded-xl blur-xl transition duration-700" />
          <div className="relative z-10 w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
