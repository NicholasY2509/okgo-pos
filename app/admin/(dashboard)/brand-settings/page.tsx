import { BrandSettingService } from "@/modules/brand-setting/services/brand-setting-service";
import { BrandSettingForm } from "@/modules/brand-setting/components/brand-setting-form";

export const metadata = {
  title: "Brand Settings - Admin Panel",
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Brand Settings</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <BrandSettingForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
