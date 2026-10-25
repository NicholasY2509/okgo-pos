"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Maximize, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FullscreenSplashProps {
  title: string
  subtitle?: string
  tenantSlug: string
}

function getInitialFullscreen(): boolean {
  if (typeof document === "undefined") return false
  return Boolean(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element })
      .webkitFullscreenElement
  )
}

interface KeyboardNavigator {
  keyboard?: {
    lock?: (keys?: string[]) => Promise<void>
    unlock?: () => void
  }
}

export function FullscreenSplash({
  title,
  subtitle = "Memuat tampilan layar penuh...",
  tenantSlug,
}: FullscreenSplashProps) {
  const [isFullscreen, setIsFullscreen] = useState(getInitialFullscreen)
  const [isVisible, setIsVisible] = useState(() => !getInitialFullscreen())
  const [isReady, setIsReady] = useState(false)

  const checkFullscreen = useCallback(() => {
    if (typeof document === "undefined") return false
    return Boolean(
      document.fullscreenElement ||
      (document as unknown as { webkitFullscreenElement?: Element })
        .webkitFullscreenElement
    )
  }, [])

  const enterFullscreen = useCallback(async () => {
    try {
      const docEl = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>
      }
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen()
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen()
      }
    } catch {
      // Browser rejected fullscreen request without direct user gesture
    }
  }, [])

  useEffect(() => {
    // Unlock any leftover keyboard locks to avoid persistent Chrome banner
    const nav =
      typeof navigator !== "undefined"
        ? (navigator as unknown as KeyboardNavigator)
        : undefined
    if (nav?.keyboard?.unlock) {
      nav.keyboard.unlock()
    }

    const handleFullscreenChange = () => {
      const active = checkFullscreen()
      setIsFullscreen(active)
      if (active) {
        setIsVisible(false)
      } else {
        // Enforce full screen: immediately re-show the splash overlay to lock the screen
        setIsVisible(true)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "F11") {
        e.preventDefault()
        e.stopPropagation()
        if (!checkFullscreen()) {
          enterFullscreen()
        }
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    window.addEventListener("keydown", handleKeyDown, { capture: true })

    // Attempt automatic fullscreen on entry
    enterFullscreen()

    // Minimum display time for smooth splash animation
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 800)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      )
      const nav =
        typeof navigator !== "undefined"
          ? (navigator as unknown as KeyboardNavigator)
          : undefined
      if (nav?.keyboard?.unlock) {
        nav.keyboard.unlock()
      }
    }
  }, [checkFullscreen, enterFullscreen])

  const handleStart = async () => {
    await enterFullscreen()
    setIsVisible(false)
  }

  return (
    <>
      {/* Persistent restore button if fullscreen was exited */}
      {!isFullscreen && !isVisible && (
        <div className="fixed top-4 right-4 z-50">
          <Button
            size="sm"
            variant="outline"
            onClick={enterFullscreen}
            className="flex items-center gap-2 rounded-full border-border/60 bg-background/80 shadow-md backdrop-blur-md hover:bg-background"
          >
            <Maximize className="h-4 w-4" />
            <span>Layar Penuh</span>
          </Button>
        </div>
      )}

      {/* Splash Screen Overlay */}
      {isVisible && (
        <div
          onClick={handleStart}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-background p-6 transition-opacity duration-500 select-none"
        >
          {/* Ambient Background Glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-primary/20 blur-[120px]"
              style={{ animationDuration: "8s" }}
            />
            <div
              className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-primary/30 blur-[100px]"
              style={{ animationDuration: "10s" }}
            />
          </div>

          <div className="relative z-10 flex max-w-sm flex-col items-center gap-6 text-center">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <Image
                src="/logo-long.webp"
                alt="Nyenyak POS"
                width={180}
                height={64}
                className="h-16 w-auto object-contain drop-shadow-sm"
                priority
              />
              <span className="font-sans text-xs font-light tracking-widest text-primary uppercase">
                {tenantSlug}
              </span>
            </div>

            {/* Title & Status */}
            <div className="space-y-1">
              <h2 className="font-display text-3xl font-light tracking-tight text-foreground">
                {title}
              </h2>
              <p className="text-sm font-light text-muted-foreground">
                {isReady && !isFullscreen
                  ? "Layar penuh wajib untuk mode ini. Ketuk untuk mengaktifkan kembali."
                  : subtitle}
              </p>
            </div>

            {/* Action / Loader */}
            <div className="mt-4 flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handleStart}
                className="flex h-12 items-center gap-2 rounded-full px-8 text-sm font-medium tracking-[0.1em] uppercase shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              >
                {!isReady ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>MENYIAPKAN...</span>
                  </>
                ) : (
                  <>
                    <Maximize className="h-4 w-4" />
                    <span>MASUK LAYAR PENUH</span>
                  </>
                )}
              </Button>
              <span className="text-xs font-light text-muted-foreground">
                Ketuk di mana saja untuk mengaktifkan Layar Penuh
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
