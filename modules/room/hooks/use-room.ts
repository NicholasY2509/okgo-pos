import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createRoomAction, updateRoomAction } from "../actions/room-action";
import { roomSchema, type RoomInput } from "../schemas/room-schema";
import { RoomWithBranch } from "../types/room-types";

interface UseRoomProps {
  initialData?: RoomWithBranch;
  onSuccess?: () => void;
}

export function useRoom({ initialData, onSuccess }: UseRoomProps = {}) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          name: initialData.name,
          capacity: initialData.capacity || undefined,
          isActive: initialData.isActive,
          branchId: initialData.branchId,
        }
      : {
          name: "",
          capacity: undefined,
          isActive: true,
          branchId: "",
        },
  });

  async function onSubmit(values: RoomInput) {
    setError(null);
    let result;

    if (initialData) {
      result = await updateRoomAction(initialData.id, values);
    } else {
      result = await createRoomAction(values);
    }

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success(initialData ? "Ruangan berhasil diperbarui!" : "Ruangan berhasil ditambahkan!");
      if (!initialData) {
        form.reset();
      }
      onSuccess?.();
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
  };
}
