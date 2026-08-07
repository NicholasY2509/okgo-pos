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
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Pengaturan Merek"
        description="Kelola pengaturan global untuk jam operasional bisnis Anda."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1 lg:col-span-1">
          <BrandSettingForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
