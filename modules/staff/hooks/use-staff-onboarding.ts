import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { staffOnboardingSchema, type StaffOnboardingInput } from "../schemas/staff-onboarding-schema";
import { onboardStaffAction } from "../actions/staff-onboarding-action";
import { useRouter } from "next/navigation";

export function useStaffOnboarding() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<StaffOnboardingInput>({
    resolver: zodResolver(staffOnboardingSchema),
    defaultValues: {
      createUserAccount: false,
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      workPositionId: "",
      branchId: "",
      roleId: "",
    },
  });

  async function onSubmit(values: StaffOnboardingInput) {
    setError(null);
    const result = await onboardStaffAction(values);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Staff successfully onboarded!");
      router.push("/admin/staff");
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}
