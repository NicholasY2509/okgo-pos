import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { createRoomAction, updateRoomAction } from "../actions/room-action";
import { roomSchema, type RoomInput } from "../schemas/room-schema";
import { RoomWithBranch } from "../types/room-types";

interface UseRoomProps {
  initialData?: RoomWithBranch;
  onSuccess?: () => void;
}

export function useRoom({ initialData, onSuccess }: UseRoomProps = {}) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof roomSchema>>({
    resolver: zodResolver(roomSchema) as any,
    defaultValues: initialData
      ? {
        id: initialData.id,
        name: initialData.name,
        capacity: initialData.capacity || undefined,
        isActive: initialData.isActive,
        isVip: initialData.isVip,
        branchId: initialData.branchId,
      }
      : {
        name: "",
        capacity: undefined,
        isActive: true,
        isVip: false,
        branchId: "",
      },
  });

  async function onSubmit(values: z.infer<typeof roomSchema>) {
    setError(null);
    let result;

    if (initialData?.id) {
      result = await updateRoomAction(initialData.id, values as RoomInput);
    } else {
      result = await createRoomAction(values as RoomInput);
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
