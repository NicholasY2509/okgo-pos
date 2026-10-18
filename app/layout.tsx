import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google"
import localFont from "next/font/local"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/session-provider";
import NextTopLoader from "nextjs-toploader";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
})

const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nyenyak.com"),
  title: {
    template: "%s | Nyenyak Healing Point",
    default: "Nyenyak Healing Point | Tempat Pijat & Spa Medan",
  },
  applicationName: "Nyenyak",
  appleWebApp: {
    title: "Nyenyak",
    statusBarStyle: "default",
    capable: true,
  },
  description: "Tempat pijat dan spa terbaik di Medan. Lepas lelah, tidur lebih nyenyak. Terapis profesional kami menghadirkan relaksasi mendalam untuk memulihkan tubuh dan kualitas tidur Anda ke tingkat yang paling optimal.",
  keywords: ["Nyenyak Healing Point", "spa", "massage", "relaksasi", "terapi tidur", "medan", "tempat pijat", "pijat medan", "spa medan", "tempat pijat medan", "pijat panggilan medan"],
  openGraph: {
    title: "Nyenyak Healing Point | Tempat Pijat & Spa Medan",
    description: "Tempat pijat dan spa terbaik di Medan. Lepas lelah, tidur lebih nyenyak. Terapis profesional kami menghadirkan relaksasi mendalam.",
    type: "website",
    locale: "id_ID",
    siteName: "Nyenyak Healing Point",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, fontSans.variable, fontHeading.variable, fontDisplay.variable, "font-sans")}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["WebSite", "DaySpa", "HealthAndBeautyBusiness"],
              "name": "Nyenyak Healing Point",
              "alternateName": ["Nyenyak", "Nyenyak Spa", "Tempat Pijat Nyenyak Medan"],
              "url": "https://www.nyenyak.com/",
              "description": "Tempat pijat dan spa terbaik di Medan. Lepas lelah, tidur lebih nyenyak.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Medan",
                "addressRegion": "Sumatera Utara",
                "addressCountry": "ID"
              },
              "telephone": "+6281234567890",
              "priceRange": "$$"
            })
          }}
        />
        <NextTopLoader color="#efb100" />
        <SessionProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
