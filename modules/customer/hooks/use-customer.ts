import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { customerSchema, type CustomerInput } from "../schemas/customer-schema";
import { createCustomerAction, updateCustomerAction } from "../actions/customer-action";

export function useCustomerForm(initialData?: CustomerInput & { id?: string }, onSuccess?: (customer: any) => void) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: "",
      phone: "",
      email: "",
    },
  });

  async function onSubmit(values: CustomerInput) {
    setError(null);
    let result;

    if (initialData?.id) {
      result = await updateCustomerAction(initialData.id, values);
    } else {
      result = await createCustomerAction(values);
    }

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(`Customer successfully ${initialData?.id ? "updated" : "created"}!`);
      if (!initialData?.id) {
        form.reset();
      }
      if (onSuccess) onSuccess(result.data);
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}
