"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { adminNav } from "./app-sidebar-data"

export function AppSidebar({ portalType = "branch", session, ...props }: React.ComponentProps<typeof Sidebar> & { portalType?: "admin" | "branch", session: any }) {
  const pathname = usePathname()

  // 1. Determine portal based on prop
  const isAdminPortal = portalType === "admin"

  // 3. Transform to match NavMain expected structure (No role filtering needed)
  const navMainGroups = adminNav.map(group => ({
    ...group,
    items: group.items.map(link => ({
      ...link,
      isActive: pathname === link.url || pathname?.startsWith(`${link.url}/`),
    }))
  }))

  const user = {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "guest@example.com",
    avatar: session?.user?.image || "",
  }

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        {/* TeamSwitcher removed as requested */}
        <div className="flex items-center gap-2 px-2 py-3 mt-1">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm">
            N
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-sm">NYENYAK</span>
            <span className="text-xs text-muted-foreground">{isAdminPortal ? "Admin Pusat" : "Cabang"}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={navMainGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
