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
  const isDirectAdminPath = pathname.startsWith("/admin")
  const navigationData = (isAdminPortal ? adminNav : branchNav) as {
    label: string
    items: {
      title: string
      url: string
      icon?: React.ReactNode
      roles?: string[]
      items?: { title: string; url: string; isActive?: boolean }[]
    }[]
  }[]

  const normalize = (p: string) => p.replace(/^\/admin/, "") || "/"
  const cleanCurrent = normalize(pathname)

  const navMainGroups = navigationData.map(group => ({
    ...group,
    items: group.items.map(link => {
      const cleanLinkUrl = normalize(link.url)
      const isActive = cleanLinkUrl === "/" ? cleanCurrent === "/" : (cleanCurrent === cleanLinkUrl || cleanCurrent.startsWith(`${cleanLinkUrl}/`))

      const targetUrl = isAdminPortal && isDirectAdminPath
        ? (cleanLinkUrl === "/" ? "/admin" : `/admin${cleanLinkUrl}`)
        : link.url

      return {
        ...link,
        url: targetUrl,
        isActive,
        items: link.items?.map((sub: { title: string; url: string }) => {
          const cleanSubUrl = normalize(sub.url)
          const isSubActive = cleanSubUrl === "/" ? cleanCurrent === "/" : (cleanCurrent === cleanSubUrl || cleanCurrent.startsWith(`${cleanSubUrl}/`))
          const subTargetUrl = isAdminPortal && isDirectAdminPath
            ? (cleanSubUrl === "/" ? "/admin" : `/admin${cleanSubUrl}`)
            : sub.url
          return {
            ...sub,
            url: subTargetUrl,
            isActive: isSubActive,
          }
        })
      }
    })
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
