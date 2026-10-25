"use client"

import { useEffect } from "react"

export function EnsureWindowedMode() {
  useEffect(() => {
    // 1. Release keyboard lock if it was engaged
    if (typeof navigator !== "undefined" && "keyboard" in navigator) {
      try {
        const nav = navigator as unknown as {
          keyboard?: { unlock?: () => void }
        }
        nav.keyboard?.unlock?.()
      } catch {
        // Ignore if unsupported or fails
      }
    }

    // 2. Exit fullscreen if active
    if (typeof document !== "undefined") {
      const isFullscreen = Boolean(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element })
          .webkitFullscreenElement
      )

      if (isFullscreen) {
        try {
          const doc = document as Document & {
            webkitExitFullscreen?: () => Promise<void>
          }
          if (doc.exitFullscreen) {
            doc.exitFullscreen().catch(() => {})
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen().catch(() => {})
          }
        } catch {
          // Ignore if browser prevents
        }
      }
    }
  }, [])

  return null
}
