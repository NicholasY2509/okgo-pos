import { LoginForm } from "@/modules/auth/components/login-form"

export const metadata = {
  title: "Admin Portal | NYENYAK",
  description: "Login to the admin dashboard",
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Dynamic Background Elements for Admin */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-1 text-center">
          {/* <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30 border border-primary/20 transform transition-transform hover:scale-105 duration-300">
            <span className="font-display font-bold text-4xl text-primary-foreground tracking-tighter">N</span>
          </div> */}
          <h1 className="text-5xl font-display text-white tracking-widest">
            NYENYAK
          </h1>
          <span className="text-primary font-sans tracking-widest text-2xl font-extralight capitalize">Admin</span>
        </div>

        <div className="w-full relative group flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-primary/10 rounded-xl blur-xl opacity-20 group-hover:opacity-50 transition duration-700" />
          <div className="relative z-10 w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
