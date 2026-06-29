import * as React from "react"
import { getStaffListAction } from "../actions/staff-action"
import { toast } from "sonner"

export function useStaffCombobox(branchId?: string) {
  const [open, setOpen] = React.useState(false)
  const [staffList, setStaffList] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function fetchStaff() {
      setLoading(true)
      const res = await getStaffListAction(branchId)
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setStaffList(res.data)
      }
      setLoading(false)
    }
    fetchStaff()
  }, [branchId])

  return {
    open,
    setOpen,
    staffList,
    loading
  }
}
