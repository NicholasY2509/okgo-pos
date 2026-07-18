"use client"

import * as React from "react"
import { useAttendanceWorkingHour } from "../hooks/use-attendance-working-hour"
import { Button } from "@/components/ui/button"
import { getWorkingHourListAction } from "../actions/working-hour-action"
import { toast } from "sonner"
import { StaffMultiPicker } from "@/modules/staff/components/staff-multi-picker"
import { Loader2 } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AttendanceWorkingHourFormProps {
  onSuccess?: () => void
}

export function AttendanceWorkingHourForm({ onSuccess }: AttendanceWorkingHourFormProps) {
  const { form, onSubmit, isSubmitting, error } = useAttendanceWorkingHour(onSuccess)

  const [workingHours, setWorkingHours] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function fetchWorkingHours() {
      setLoading(true)
      const res = await getWorkingHourListAction()
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setWorkingHours(res.data)
      }
      setLoading(false)
    }
    fetchWorkingHours()
  }, [])

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Working Hour Template</label>
        <Select 
          disabled={loading} 
          value={form.watch("workingHourId")} 
          onValueChange={(val) => form.setValue("workingHourId", val, { shouldValidate: true })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {workingHours.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.workingHourId && (
          <p className="text-sm text-destructive">{form.formState.errors.workingHourId.message}</p>
        )}
      </div>

      <div className="space-y-2 flex flex-col">
        <label className="text-sm font-medium">Staff Members</label>
        <StaffMultiPicker
          value={form.watch("staffIds") || []}
          onChange={(val) => form.setValue("staffIds", val, { shouldValidate: true })}
        />
        {form.formState.errors.staffIds && (
          <p className="text-sm text-destructive">{form.formState.errors.staffIds.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">Start Date</label>
          <DatePicker 
            date={form.watch("startDate")} 
            setDate={(date) => form.setValue("startDate", date as Date, { shouldValidate: true })} 
          />
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-sm font-medium">End Date</label>
          <DatePicker 
            date={form.watch("endDate")} 
            setDate={(date) => form.setValue("endDate", date as Date, { shouldValidate: true })} 
          />
          {form.formState.errors.endDate && (
            <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
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
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Assigning..." : "Assign Schedules"}
        </Button>
      </div>
    </form>
  )
}
