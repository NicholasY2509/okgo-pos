import { BrandSettingService } from "@/modules/brand-setting/services/brand-setting-service";
import { BrandSettingForm } from "@/modules/brand-setting/components/brand-setting-form";
import { PageHeader } from "@/components/page-header";

export const metadata = {
  title: "Brand Settings | Admin",
};

export default async function BrandSettingsPage() {
  const brandSetting = await BrandSettingService.get();

  const initialData = brandSetting
    ? {
        businessStartTime: brandSetting.businessStartTime,
        businessEndTime: brandSetting.businessEndTime,
        therapistIncentiveType: brandSetting.therapistIncentiveType as "FIXED" | "DURATION_BASED",
        therapistIncentiveAmount: Number(brandSetting.therapistIncentiveAmount),
        therapistIncentiveDuration: brandSetting.therapistIncentiveDuration,
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Pengaturan Merek"
        description="Kelola pengaturan global untuk jam operasional bisnis Anda."
      />
      
      <div className="mt-4">
        <BrandSettingForm initialData={initialData} />
      </div>
    </div>
  );
}
