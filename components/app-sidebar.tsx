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
  useSidebar,
} from "@/components/ui/sidebar"

import { adminNav, branchNav } from "./app-sidebar-data"

export function AppSidebar({ portalType = "branch", session, ...props }: React.ComponentProps<typeof Sidebar> & { portalType?: "admin" | "branch", session: any }) {
  const pathname = usePathname()
  const { state } = useSidebar()

  const isAdminPortal = portalType === "admin"
  const navigationData = isAdminPortal ? adminNav : branchNav

  const navMainGroups = navigationData.map(group => ({
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
        <div className="flex items-center justify-center gap-2 px-2 py-3 mt-1">
          {state === "expanded" ? (
            <div className="flex flex-col items-center justify-center -ml-3">
              <img src="/logo-long.webp" alt="Nyenyak Logo" className="h-12 object-contain" />
            </div>
          ) : (
            <img src="/logo-only.png" alt="Nyenyak Logo" className="h-4 object-contain" />
          )}
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
