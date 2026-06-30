"use client"

import { ColumnDef } from "@tanstack/react-table"
import { RoleDialog } from "./role-dialog"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { deleteRoleAction } from "../actions/role-action"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type RoleData = {
  id: string
  name: string
  description: string | null
  _count?: {
    branchStaffs: number
  }
}

export const roleColumns: ColumnDef<RoleData>[] = [
  {
    accessorKey: "name",
    header: "Nama Role",
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => row.original.description || <span className="text-muted-foreground italic">Tidak ada deskripsi</span>,
  },
  {
    accessorKey: "_count.branchStaffs",
    header: "Jumlah Pengguna",
    cell: ({ row }) => row.original._count?.branchStaffs || 0,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end gap-2">
          <RoleDialog
            initialData={{
              id: row.original.id,
              name: row.original.name,
              description: row.original.description || undefined
            }}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <DeleteRoleButton id={row.original.id} name={row.original.name} count={row.original._count?.branchStaffs || 0} />
        </div>
      )
    },
  },
]

function DeleteRoleButton({ id, name, count }: { id: string, name: string, count: number }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteRoleAction(id)
    setIsDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Role berhasil dihapus!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Role?</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus role <strong>{name}</strong>? Tindakan ini tidak dapat dibatalkan.
            {count > 0 && (
              <div className="mt-2 text-destructive font-medium">
                Peringatan: Terdapat {count} pengguna/staf yang memiliki role ini. Menghapus role dapat menyebabkan masalah akses.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
