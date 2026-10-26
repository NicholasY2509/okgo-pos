import { auth } from "@/modules/auth/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AdminBreadcrumb } from "@/components/admin-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <SidebarProvider>
      <AppSidebar portalType="admin" session={session} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 backdrop-blur px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <AdminBreadcrumb />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portal Admin</span>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

