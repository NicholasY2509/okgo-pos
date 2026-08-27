import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { updateBrandSettingAction } from "../actions/brand-setting-action";
import { brandSettingSchema, type BrandSettingInput } from "../schemas/brand-setting";

interface UseBrandSettingProps {
  initialData?: BrandSettingInput;
}

export function useBrandSetting({ initialData }: UseBrandSettingProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BrandSettingInput>({
    resolver: zodResolver(brandSettingSchema) as any,
    defaultValues: initialData || {
      businessStartTime: "08:00",
      businessEndTime: "21:00",
      therapistIncentiveType: "FIXED",
      therapistIncentiveAmount: 0,
      therapistIncentiveDuration: 60,
    },
  });

  async function onSubmit(values: BrandSettingInput) {
    setError(null);
    const result = await updateBrandSettingAction(values);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Successfully updated brand settings!");
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit, (errors) => {
      console.log("Validation Errors in hook:", errors);
    }),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}
