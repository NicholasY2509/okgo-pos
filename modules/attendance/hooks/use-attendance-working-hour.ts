import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { assignBulkAttendanceWorkingHourAction } from "../actions/attendance-working-hour-action";
import { bulkAttendanceWorkingHourSchema, type BulkAttendanceWorkingHourInput } from "../schemas/attendance-working-hour";

export function useAttendanceWorkingHour(onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BulkAttendanceWorkingHourInput>({
    resolver: zodResolver(bulkAttendanceWorkingHourSchema) as any,
    defaultValues: { staffIds: [], workingHourId: "", startDate: new Date(), endDate: new Date() },
  });

  async function onSubmit(values: BulkAttendanceWorkingHourInput) {
    setError(null);
    const result = await assignBulkAttendanceWorkingHourAction(values);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Successfully assigned schedules!");
      form.reset();
      if (onSuccess) onSuccess();
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}
