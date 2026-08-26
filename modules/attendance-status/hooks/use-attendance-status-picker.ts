import * as React from "react"
import { getAttendanceStatusListAction } from "../actions/attendance-status-action"
import { toast } from "sonner"

export function useAttendanceStatusPicker(enabled: boolean = true) {
  const [open, setOpen] = React.useState(false)
  const [statusList, setStatusList] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return;
    async function fetchStatuses() {
      setLoading(true)
      const res = await getAttendanceStatusListAction()
      if (res.error) {
        toast.error(res.error)
      } else if (res.data) {
        setStatusList(res.data)
      }
      setLoading(false)
    }
    fetchStatuses()
  }, [])

  return {
    open,
    setOpen,
    statusList,
    loading
  }
}
