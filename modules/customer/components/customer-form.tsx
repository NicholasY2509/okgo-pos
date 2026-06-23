"use client";

import { useCustomerForm } from "../hooks/use-customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerInput } from "../schemas/customer-schema";

interface CustomerFormProps {
  initialData?: CustomerInput & { id?: string };
  onSuccess?: (customer: any) => void;
  onCancel?: () => void;
}

export function CustomerForm({ initialData, onSuccess, onCancel }: CustomerFormProps) {
  const { form, onSubmit, isSubmitting, error } = useCustomerForm(initialData, onSuccess);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input {...form.register("name")} placeholder="e.g. John Doe" />
        {form.formState.errors.name && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Phone Number</label>
        <Input {...form.register("phone")} placeholder="e.g. 081234567890" />
        {form.formState.errors.phone && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Email (Optional)</label>
        <Input type="email" {...form.register("email")} placeholder="john@example.com" />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
