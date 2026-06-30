"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Branch } from "@/modules/branch/types/branch-types";
import { RoomDialog } from "./room-dialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { deleteRoomAction } from "../actions/room-action";
import { toast } from "sonner";
import { Pencil, Trash } from "lucide-react";
import { RoomWithBranch } from "../types/room-types";

interface GetColumnsProps {
  branches: Pick<Branch, "id" | "name">[];
}

export const getColumns = ({ branches }: GetColumnsProps): ColumnDef<RoomWithBranch>[] => [
  {
    accessorKey: "name",
    header: "Nama Ruangan",
  },
  {
    accessorKey: "capacity",
    header: "Kapasitas",
    cell: ({ row }) => {
      const capacity = row.getValue("capacity") as number | null;
      return capacity ? `${capacity} orang` : "-";
    },
  },
  {
    accessorKey: "branch.name",
    header: "Cabang",
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Aktif" : "Tidak Aktif"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const room = row.original;

      return (
        <div className="flex justify-end gap-2">
          <RoomDialog
            initialData={room}
            branches={branches}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
          />
          <DeleteRoomButton id={room.id} name={room.name} />
        </div>
      );
    },
  },
];

function DeleteRoomButton({ id, name }: { id: string, name: string }) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteRoomAction(id)
    setIsDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Ruangan berhasil dihapus!")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive">
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus Ruangan?</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus ruangan <strong>{name}</strong>? Tindakan ini tidak dapat dibatalkan.
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
