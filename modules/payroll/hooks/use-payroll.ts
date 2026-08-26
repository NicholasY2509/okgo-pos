import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GenerateBatchPayrollSchema, type GenerateBatchPayrollInput, UpdatePayrollItemSchema, type UpdatePayrollItemInput } from "../schemas/payroll";
import { generateBatchPayrollAction, addPayrollItemAction, deletePayrollItemAction, settlePayrollAction } from "../actions/payroll-action";

export function useGenerateBatchPayroll(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<GenerateBatchPayrollInput>({
    resolver: zodResolver(GenerateBatchPayrollSchema),
    defaultValues: {
      monthPeriod: "",
      // startDate and endDate will be set when monthPeriod is selected
    },
  });

  async function onSubmit(values: GenerateBatchPayrollInput) {
    setError(null);
    const result = await generateBatchPayrollAction(values);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Penggajian massal berhasil dibuat!");
      form.reset();
      onSuccess?.();
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}

export function usePayrollDetails() {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handleAddManualItem(values: UpdatePayrollItemInput, onSuccess?: () => void) {
    setIsUpdating(true);
    const result = await addPayrollItemAction(values);
    setIsUpdating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Komponen berhasil ditambahkan");
      onSuccess?.();
    }
  }

  async function handleDeleteItem(itemId: string) {
    setIsUpdating(true);
    const result = await deletePayrollItemAction(itemId);
    setIsUpdating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Komponen berhasil dihapus");
    }
  }

  async function handleSettle(payrollId: string, onSuccess?: () => void) {
    setIsUpdating(true);
    const result = await settlePayrollAction(payrollId);
    setIsUpdating(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Penggajian ditandai sebagai LUNAS!");
      onSuccess?.();
    }
  }

  return {
    handleAddManualItem,
    handleDeleteItem,
    handleSettle,
    isUpdating,
  };
}
