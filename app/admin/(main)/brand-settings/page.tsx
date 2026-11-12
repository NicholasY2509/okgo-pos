import { BrandSettingService } from "@/modules/brand-setting/services/brand-setting-service";
import { BrandSettingForm } from "@/modules/brand-setting/components/brand-setting-form";
import { MarketingSettingService } from "@/modules/marketing/services/marketing-setting-service";
import { MarketingMaintenanceToggle } from "@/modules/marketing/components/marketing-maintenance-toggle";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Brand Settings | Admin",
};

export default async function BrandSettingsPage() {
  const [brandSetting, marketingSetting] = await Promise.all([
    BrandSettingService.get(),
    MarketingSettingService.get(),
  ]);

  const initialData = brandSetting
    ? {
      businessStartTime: brandSetting.businessStartTime,
      businessEndTime: brandSetting.businessEndTime,
    }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pengaturan Merek & Situs"
        description="Kelola pengaturan global untuk jam operasional bisnis dan status halaman publik."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <BrandSettingForm initialData={initialData} />
        <MarketingMaintenanceToggle initialIsMaintenance={marketingSetting?.isMaintenanceMode ?? false} />
      </div>
    </div>
  );
}
