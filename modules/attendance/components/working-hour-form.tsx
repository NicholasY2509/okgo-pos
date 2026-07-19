"use client"

import * as React from "react"
import { useWorkingHour } from "../hooks/use-working-hour"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WorkingHourInput } from "../schemas/working-hour"

interface WorkingHourFormProps {
  initialData?: WorkingHourInput & { id: string }
  onSuccess?: () => void
}

export function WorkingHourForm({ initialData, onSuccess }: WorkingHourFormProps) {
  const { form, onSubmit, isSubmitting, error, isEditing } = useWorkingHour(initialData, onSuccess)

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Shift Code</label>
          <Input placeholder="M" {...form.register("code")} />
          {form.formState.errors.code && (
            <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Shift Name</label>
          <Input placeholder="Morning Shift" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Clock In</label>
          <Input placeholder="08:00" {...form.register("clockIn")} />
          {form.formState.errors.clockIn && (
            <p className="text-sm text-destructive">{form.formState.errors.clockIn.message}</p>
          )}
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Clock Out</label>
          <Input placeholder="17:00" {...form.register("clockOut")} />
          {form.formState.errors.clockOut && (
            <p className="text-sm text-destructive">{form.formState.errors.clockOut.message}</p>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive mt-2" aria-live="polite">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onSuccess && (
          <Button type="button" variant="outline" onClick={onSuccess}>Cancel</Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (isEditing ? "Save Changes" : "Create Template")}
        </Button>
      </div>
    </form>
  )
}
