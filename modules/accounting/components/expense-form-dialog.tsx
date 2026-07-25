"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ExpenseForm } from "./expense-form"

interface ExpenseFormDialogProps {
  branchId: string
  accounts: any[]
  trigger?: React.ReactNode
}

export function ExpenseFormDialog({ branchId, accounts, trigger }: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Catat Pengeluaran
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ExpenseForm branchId={branchId} accounts={accounts} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
