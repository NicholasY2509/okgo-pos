"use client";

import { useState } from "react";
import { RoomWithBranch } from "../types/room-types";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./room-columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomForm } from "./room-form";
import { deleteRoomAction } from "../actions/room-action";
import { toast } from "sonner";
import {
  DialogFooter,
} from "@/components/ui/dialog";
import { Branch } from "@/modules/branch/types/branch-types";

interface RoomListProps {
  data: RoomWithBranch[];
  branches: Pick<Branch, "id" | "name">[];
}

export function RoomList({ data, branches }: RoomListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithBranch | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomWithBranch | null>(null);

  const handleEdit = (room: RoomWithBranch) => {
    setEditingRoom(room);
  };

  const handleDeleteClick = (room: RoomWithBranch) => {
    setDeletingRoom(room);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoom) return;

    const result = await deleteRoomAction(deletingRoom.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Ruangan berhasil dihapus!");
    }
    setDeletingRoom(null);
  };

  const columns = getColumns({ onEdit: handleEdit, onDelete: handleDeleteClick });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Ruang
        </Button>
      </div>

      <DataTable columns={columns} data={data} />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Ruang</DialogTitle>
            <DialogDescription>
              Tambahkan ruangan baru ke cabang yang dipilih.
            </DialogDescription>
          </DialogHeader>
          <RoomForm
            branches={branches}
            onSuccess={() => setIsCreateOpen(false)}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ruang</DialogTitle>
            <DialogDescription>
              Perbarui detail ruangan.
            </DialogDescription>
          </DialogHeader>
          {editingRoom && (
            <RoomForm
              initialData={editingRoom}
              branches={branches}
              onSuccess={() => setEditingRoom(null)}
              onCancel={() => setEditingRoom(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingRoom} onOpenChange={(open) => !open && setDeletingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah Anda yakin?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus ruangan secara permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeletingRoom(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
