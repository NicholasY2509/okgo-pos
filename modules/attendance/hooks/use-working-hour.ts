import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createWorkingHourAction, updateWorkingHourAction } from "../actions/working-hour-action";
import { workingHourSchema, type WorkingHourInput } from "../schemas/working-hour";

export function useWorkingHour(initialData?: WorkingHourInput & { id?: string }, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!initialData?.id;

  const form = useForm<WorkingHourInput>({
    resolver: zodResolver(workingHourSchema),
    defaultValues: initialData || { code: "", name: "", clockIn: "08:00", clockOut: "17:00" },
  });

  async function onSubmit(values: WorkingHourInput) {
    setError(null);
    let result;
    
    if (isEditing) {
      result = await updateWorkingHourAction(initialData.id as string, values);
    } else {
      result = await createWorkingHourAction(values);
    }

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(`Successfully ${isEditing ? "updated" : "created"} working hour template!`);
      if (!isEditing) form.reset();
      if (onSuccess) onSuccess();
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    isEditing,
  };
}
