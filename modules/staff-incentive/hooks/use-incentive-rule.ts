import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { incentiveRuleSchema, IncentiveRuleInput } from "../schemas/incentive-rule";
import { createIncentiveRuleAction, updateIncentiveRuleAction, deleteIncentiveRuleAction } from "../actions/incentive-rule-action";

export function useIncentiveRuleForm(initialData?: any, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<IncentiveRuleInput>({
    resolver: zodResolver(incentiveRuleSchema) as any,
    values: {
      id: initialData?.id,
      name: initialData?.name || "",
      targetWorkPositionIds: initialData?.targetWorkPositions?.map((wp: any) => wp.id) || [],
      ruleType: initialData?.ruleType || "FIXED_AMOUNT",
      flatAmount: initialData?.flatAmount || 0,
      flatPercentage: initialData?.flatPercentage || 0,
      isActive: initialData?.isActive ?? true,
      tiers: initialData?.tiers || [],
    },
  });

  async function onSubmit(values: IncentiveRuleInput) {
    setError(null);
    let result;

    if (values.id) {
      result = await updateIncentiveRuleAction(values.id, values);
    } else {
      result = await createIncentiveRuleAction(values);
    }

    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(values.id ? "Berhasil memperbarui aturan!" : "Berhasil membuat aturan!");
      if (onSuccess) onSuccess();
      if (!values.id) form.reset();
    }
  }

  async function onDelete(id: string) {
    setIsDeleting(true);
    const result = await deleteIncentiveRuleAction(id);
    setIsDeleting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Berhasil menghapus aturan!");
      if (onSuccess) onSuccess();
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit as any),
    onDelete,
    isSubmitting: form.formState.isSubmitting,
    isDeleting,
    error,
  };
}
