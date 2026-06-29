import { useState } from "react";
import { RoomWithBranch } from "../types/room-types";
import { deleteRoomAction } from "../actions/room-action";
import { toast } from "sonner";

export function useRoomList() {
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

  return {
    isCreateOpen,
    setIsCreateOpen,
    editingRoom,
    setEditingRoom,
    deletingRoom,
    setDeletingRoom,
    handleEdit,
    handleDeleteClick,
    handleConfirmDelete
  };
}
