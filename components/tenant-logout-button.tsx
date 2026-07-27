"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function TenantLogoutButton() {
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: false })
        window.location.href = "/login"
      }}
      className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-full transition-all active:scale-95 ml-2"
    >
      <LogOut className="w-4 h-4" />
      Keluar
    </button>
  )
}
