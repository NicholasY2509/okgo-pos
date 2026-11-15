import { useCallback, useState } from "react"
import { toast } from "sonner"
import { checkFaceApiConnectionAction } from "@/modules/staff/actions/face-api-health-action"
import type { FaceApiConnectionStatus } from "@/modules/staff/services/face-api-client"

export function useFaceApiHealth() {
  const [status, setStatus] = useState<FaceApiConnectionStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = useCallback(async () => {
    setIsChecking(true)
    setError(null)
    try {
      const result = await checkFaceApiConnectionAction()
      if (!result.success) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      setStatus(result.data)
      if (result.data.ok) {
        toast.success("Koneksi Face API & .env valid")
      } else {
        toast.error(result.data.message)
      }
    } catch {
      const fallback = "Terjadi kesalahan saat memeriksa koneksi Face API."
      setError(fallback)
      toast.error(fallback)
    } finally {
      setIsChecking(false)
    }
  }, [])

  return {
    status,
    isChecking,
    error,
    checkConnection,
  }
}
