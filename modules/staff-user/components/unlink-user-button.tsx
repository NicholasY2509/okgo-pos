"use client"

import { useUnlinkUser } from "../hooks/use-unlink-user"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface UnlinkUserButtonProps {
  staffId: string
  userId: string
}

export function UnlinkUserButton({ staffId, userId }: UnlinkUserButtonProps) {
  const { onUnlink, isSubmitting } = useUnlinkUser()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={isSubmitting}
      onClick={() => onUnlink({ staffId, userId })}
      title="Unlink User"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
