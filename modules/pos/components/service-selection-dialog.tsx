"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffCombobox } from "../../staff/components/staff-combobox";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ServiceSelectionDialogProps {
  selectedProduct: any | null;
  onClose: () => void;
  staff: any[];
  rooms: any[];
  branchId: string;
  onAddServiceToCart: (staffId: string, roomId: string, isVip?: boolean) => void;
}

export function ServiceSelectionDialog({ selectedProduct, onClose, staff, rooms, branchId, onAddServiceToCart }: ServiceSelectionDialogProps) {
  const [isVipUpgrade, setIsVipUpgrade] = useState<boolean>(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  const filteredRooms = rooms.filter((r) => (isVipUpgrade ? Boolean(r.isVip) : !r.isVip));

  // Reset state when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setIsVipUpgrade(false);
      setSelectedStaffId("");
      setSelectedRoomId("");
    }
  }, [selectedProduct]);

  const handleVipChange = (checked: boolean) => {
    setIsVipUpgrade(checked);
    const currentRoom = rooms.find((r) => r.id === selectedRoomId);
    if (currentRoom && Boolean(currentRoom.isVip) !== checked) {
      setSelectedRoomId("");
    }
  };

  const handleAdd = () => {
    onAddServiceToCart(selectedStaffId, selectedRoomId, isVipUpgrade);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-muted-foreground font-semibold">Terapis</Label>
              <StaffCombobox
                serviceId={selectedProduct?.id}
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                branchId={branchId}
                className=""
              />
            </div>

            <div className="space-y-3">
              <Label className="text-muted-foreground font-semibold">
                Ruangan {isVipUpgrade ? "(VIP)" : ""}
              </Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger className="w-full h-12 border-input">
                  <SelectValue placeholder={isVipUpgrade ? "Pilih Ruangan VIP" : "Pilih Ruangan"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredRooms.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {isVipUpgrade ? "Tidak ada ruangan VIP aktif" : "Tidak ada ruangan reguler aktif"}
                    </div>
                  ) : (
                    filteredRooms.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="cursor-pointer">
                        {r.name} {r.isVip ? "(VIP)" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="dialog-vip-upgrade"
              checked={isVipUpgrade}
              onCheckedChange={(checked) => handleVipChange(checked === true)}
            />
            <label
              htmlFor="dialog-vip-upgrade"
              className="text-sm font-medium leading-none cursor-pointer text-amber-600"
            >
              Upgrade ke VIP (+ Rp 80.000)
            </label>
          </div>


        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={onClose} className="">
            Batal
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedStaffId || !selectedRoomId}
          >
            Tambahkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
