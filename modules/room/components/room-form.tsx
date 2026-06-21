"use client";

import { useRoom } from "../hooks/use-room";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RoomWithBranch } from "../types/room-types";
import { Branch } from "@/modules/branch/types/branch-types";
import { Controller } from "react-hook-form";

interface RoomFormProps {
  initialData?: RoomWithBranch;
  branches: Pick<Branch, "id" | "name">[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoomForm({ initialData, branches, onSuccess, onCancel }: RoomFormProps) {
  const { form, onSubmit, isSubmitting, error } = useRoom({ initialData, onSuccess });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input id="name" placeholder="Contoh: Ruang VIP 1, Ruang Mawar" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Kapasitas (Opsional)</Label>
        <Input id="capacity" type="number" placeholder="Jumlah orang" {...form.register("capacity")} />
        {form.formState.errors.capacity && (
          <p className="text-sm text-destructive">{form.formState.errors.capacity.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="branchId">Cabang</Label>
        <Controller
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih cabang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.branchId && (
          <p className="text-sm text-destructive">{form.formState.errors.branchId.message}</p>
        )}
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Status Aktif</Label>
        </div>
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
