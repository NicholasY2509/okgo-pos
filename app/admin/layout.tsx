import type { Metadata } from "next"
import { PwaProvider } from "@/components/pwa-provider"

export const metadata: Metadata = {
  title: {
    template: "%s | Nyenyak Admin",
    default: "Nyenyak Admin",
  },
  applicationName: "Nyenyak Admin",
  manifest: "/api/manifest",
  appleWebApp: {
    title: "Nyenyak Admin",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PwaProvider>{children}</PwaProvider>
}
