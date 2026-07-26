"use client";

import { usePaymentMethodForm } from "../hooks/use-payment-method";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentMethodInput } from "../schemas/payment-method-schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CoaCombobox } from "@/modules/accounting/components/coa-combobox";

interface PaymentMethodFormProps {
  initialData?: PaymentMethodInput & { id?: string };
  accounts?: any[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PaymentMethodForm({ initialData, accounts = [], onSuccess, onCancel }: PaymentMethodFormProps) {
  const { form, onSubmit, isSubmitting, error } = usePaymentMethodForm(initialData, onSuccess);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-row gap-2">
        <div className="w-3/4">
          <label className="text-sm font-medium">Name</label>
          <Input {...form.register("name")} placeholder="e.g. BCA EDC" />
          {form.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            onValueChange={(value) => form.setValue("type", value as any)}
            defaultValue={form.getValues("type")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="EDC">EDC</SelectItem>
              <SelectItem value="QRIS">QRIS</SelectItem>
              <SelectItem value="TRANSFER">Transfer</SelectItem>
              <SelectItem value="VOUCHER">Voucher</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.type && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.type.message}</p>
          )}
        </div>
      </div>


      <div>
        <label className="text-sm font-medium">Akun (COA)</label>
        <CoaCombobox
          accounts={accounts}
          value={form.watch("ledgerAccountId")}
          onChange={(value) => form.setValue("ledgerAccountId", value)}
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isActive"
          checked={form.watch("isActive")}
          onCheckedChange={(checked) => form.setValue("isActive", checked === true)}
        />
        <label
          htmlFor="isActive"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Active
        </label>
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
