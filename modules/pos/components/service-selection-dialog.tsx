"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ServiceSelectionDialogProps {
  selectedProduct: any | null;
  onClose: () => void;
  staff: any[];
  rooms: any[];
  onAddServiceToCart: (staffId: string, roomId: string) => void;
}

export function ServiceSelectionDialog({ selectedProduct, onClose, staff, rooms, onAddServiceToCart }: ServiceSelectionDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  // Reset state when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setSelectedStaffId("");
      setSelectedRoomId("");
    }
  }, [selectedProduct]);

  const handleAdd = () => {
    onAddServiceToCart(selectedStaffId, selectedRoomId);
  };

  return (
    <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Pilih Terapis & Ruangan</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Label className="text-primary text-xs font-bold uppercase tracking-wider mb-1 block">Layanan Terpilih</Label>
            <p className="font-semibold text-foreground text-lg">{selectedProduct?.name}</p>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground font-semibold">Terapis</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger className="h-12 border-input">
                <SelectValue placeholder="Pilih Terapis" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="py-3 cursor-pointer">
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground font-semibold">Ruangan</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger className="h-12 border-input">
                <SelectValue placeholder="Pilih Ruangan" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="py-3 cursor-pointer">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose} className="h-11 px-6">
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedStaffId || !selectedRoomId}
            className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            Tambahkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
