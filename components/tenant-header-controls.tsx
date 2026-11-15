"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Maximize, Minimize, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TenantHeaderControls() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };

    handleFullscreenChange();
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const toggleFullscreen = async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };

    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } else if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
    } catch {
      // Ignore fullscreen permission/gesture errors
    }
  };

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={isDark ? "Mode Terang" : "Mode Gelap"}
        aria-label={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
        className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
        aria-label={isFullscreen ? "Keluar Layar Penuh" : "Masuk Layar Penuh"}
        className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
      </Button>
    </div>
  );
}
