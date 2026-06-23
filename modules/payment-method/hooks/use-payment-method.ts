import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { paymentMethodSchema, type PaymentMethodInput } from "../schemas/payment-method-schema";
import { createPaymentMethodAction, updatePaymentMethodAction } from "../actions/payment-method-action";

export function usePaymentMethodForm(initialData?: PaymentMethodInput & { id?: string }, onSuccess?: () => void) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof paymentMethodSchema>>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: initialData || {
      name: "",
      type: "CASH",
      isActive: true,
    },
  });

  async function onSubmit(values: z.infer<typeof paymentMethodSchema>) {
    setError(null);
    let result;

    if (initialData?.id) {
      result = await updatePaymentMethodAction(initialData.id, values as PaymentMethodInput);
    } else {
      result = await createPaymentMethodAction(values as PaymentMethodInput);
    }

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(`Payment Method successfully ${initialData?.id ? "updated" : "created"}!`);
      if (!initialData?.id) {
        form.reset();
      }
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
