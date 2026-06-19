import { useState } from "react"
import { toast } from "sonner"
import { unlinkUserFromStaffAction } from "../actions/staff-user-action"
import { type DeleteStaffUserInput } from "../schemas/staff-user-schema"

export function useUnlinkUser() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onUnlink(values: DeleteStaffUserInput) {
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await unlinkUserFromStaffAction(values)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success("User successfully unlinked from staff.")
      }
      return result
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    onUnlink,
    isSubmitting,
    error,
  }
}
