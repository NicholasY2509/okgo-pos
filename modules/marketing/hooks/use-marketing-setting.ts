"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMarketingSettingAction } from "../actions/marketing-setting-action";

interface UseMarketingSettingOptions {
  initialIsMaintenance?: boolean;
}

export function useMarketingSetting(options?: UseMarketingSettingOptions) {
  const [isMaintenance, setIsMaintenance] = useState(options?.initialIsMaintenance ?? false);
  const [isPending, startTransition] = useTransition();

  const toggleMaintenance = (checked: boolean) => {
    const previous = isMaintenance;
    setIsMaintenance(checked);

    startTransition(async () => {
      const result = await updateMarketingSettingAction({ isMaintenanceMode: checked });
      if (result.error) {
        setIsMaintenance(previous);
        toast.error(result.error);
      } else {
        toast.success(
          checked
            ? "Mode pemeliharaan diaktifkan. Website publik sekarang menampilkan halaman pemeliharaan."
            : "Mode pemeliharaan dinonaktifkan. Website publik sekarang dapat diakses secara normal."
        );
      }
    });
  };

  return {
    isMaintenance,
    isPending,
    toggleMaintenance,
  };
}
