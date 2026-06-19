"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { BuildingIcon } from "lucide-react"

import { adminNav, branchNav } from "./app-sidebar-data"

export function AppSidebar({ portalType = "branch", ...props }: React.ComponentProps<typeof Sidebar> & { portalType?: "admin" | "branch" }) {
  const pathname = usePathname()

  // NOTE: If you haven't wrapped your app in <SessionProvider>, useSession will throw an error.
  // Make sure your root layout or admin layout has a SessionProvider!
  const { data: session } = useSession()

  // 1. Determine portal based on prop
  const isAdminPortal = portalType === "admin"

  // 2. Extract user role (Default to Guest if no session)
  // Note: Adjust the role extraction based on how you attached role to the Auth.js session object
  const userRole = (session?.user as any)?.role?.name || "Admin" // Temporarily defaulting to Admin for testing if session isn't fully configured

  // 3. Select and filter the menu
  const activeMenu = isAdminPortal ? adminNav : branchNav
  const permittedGroups = activeMenu.map(group => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(userRole))
  })).filter(group => group.items.length > 0)

  // 4. Transform to match NavMain expected structure
  const navMainGroups = permittedGroups.map(group => ({
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

  // Placeholder for branch switching or tenant info
  const teams = [
    {
      name: isAdminPortal ? "Global Admin" : "Branch View",
      logo: (<BuildingIcon />),
      plan: userRole,
    }
  ]

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
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
