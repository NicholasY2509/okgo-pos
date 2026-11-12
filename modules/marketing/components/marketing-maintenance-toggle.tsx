"use client";

import Link from "next/link";
import { ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMarketingSetting } from "../hooks/use-marketing-setting";

interface MarketingMaintenanceToggleProps {
  initialIsMaintenance?: boolean;
}

export function MarketingMaintenanceToggle({ initialIsMaintenance = false }: MarketingMaintenanceToggleProps) {
  const { isMaintenance, isPending, toggleMaintenance } = useMarketingSetting({ initialIsMaintenance });

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Status Landing Page</CardTitle>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isMaintenance
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            }`}
          >
            {isMaintenance ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pemeliharaan</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aktif Publik</span>
              </>
            )}
          </span>
        </div>
        <CardDescription>
          Kelola ketersediaan halaman depan (marketing landing page) untuk pengunjung publik.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-muted/40">
          <div className="space-y-1">
            <Label htmlFor="marketing-maintenance-switch" className="text-sm font-medium cursor-pointer">
              Mode Pemeliharaan (Maintenance Mode)
            </Label>
            <p className="text-xs text-muted-foreground">
              {isMaintenance
                ? "Pengunjung diarahkan ke halaman pemeliharaan sistem saat membuka website."
                : "Pengunjung dapat mengakses halaman utama, katalog menu, dan membuat reservasi."}
            </p>
          </div>
          <Switch
            id="marketing-maintenance-switch"
            checked={isMaintenance}
            disabled={isPending}
            onCheckedChange={toggleMaintenance}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <span>Pratinjau tampilan publik:</span>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
          >
            Buka Halaman Publik
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
