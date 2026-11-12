import type { Metadata } from "next";
import { MarketingSettingService } from "@/modules/marketing/services/marketing-setting-service";
import { MarketingMaintenanceNotice } from "@/modules/marketing/components/marketing-maintenance-notice";
import { MarketingLandingPage } from "@/modules/marketing/components/marketing-landing-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const isMaintenance = await MarketingSettingService.isMaintenanceMode();

  if (isMaintenance) {
    return {
      title: "Sedang Dalam Pembaruan | Nyenyak Healing Point",
      description: "Kami sedang melakukan pembaruan untuk menghadirkan pengalaman yang lebih baik bagi Anda.",
    };
  }

  return {
    title: "Nyenyak Healing Point | Tempat Pijat & Spa Premium di Medan",
    description: "Tempat Pijat & Spa Premium di Medan untuk Relaksasi Maksimal.",
  };
}

export default async function MarketingPage() {
  const isMaintenance = await MarketingSettingService.isMaintenanceMode();

  if (isMaintenance) {
    return <MarketingMaintenanceNotice />;
  }

  return <MarketingLandingPage />;
}
