"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StaffCombobox } from "@/modules/staff/components/staff-combobox";
import { ProductCombobox } from "@/modules/product/components/product-combobox";
import type { CartItem } from "../../stores/pos-store";

interface AddonServiceDialogProps {
  parentItem: CartItem | null;
  onClose: () => void;
  products: any[];
  staff: any[];
  rooms?: any[];
  branchId: string;
  onConfirm: (addon: {
    serviceId: string;
    name: string;
    unitPrice: number;
    staffId: string;
    staffName: string;
    roomId: string;
    roomName: string;
  }) => void;
}

export function AddonServiceDialog({
  parentItem,
  onClose,
  products,
  staff,
  rooms = [],
  branchId,
  onConfirm,
}: AddonServiceDialogProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [sameStaff, setSameStaff] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [sameRoom, setSameRoom] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");

  useEffect(() => {
    if (parentItem) {
      setSelectedServiceId("");
      setSameStaff(true);
      setSelectedStaffId(parentItem.staffId || "");
      setSameRoom(true);
      setSelectedRoomId(parentItem.roomId || "");
    }
  }, [parentItem]);

  const serviceProducts = products.filter((p) => p.isActive !== false);
  const selectedProduct = serviceProducts.find((p) => p.id === selectedServiceId);
  const effectiveStaffId = sameStaff ? parentItem?.staffId || "" : selectedStaffId;
  const effectiveRoomId = sameRoom ? parentItem?.roomId || "" : selectedRoomId;

  const handleConfirm = () => {
    if (!selectedProduct || !effectiveStaffId || !effectiveRoomId) return;
    const foundStaff = staff.find((s) => s.id === effectiveStaffId);
    const staffName = foundStaff
      ? `${foundStaff.firstName || ""} ${foundStaff.lastName || ""}`.trim()
      : parentItem?.staffName || "Terapis";

    const foundRoom = rooms.find((r) => r.id === effectiveRoomId);
    const roomName = foundRoom?.name || parentItem?.roomName || "Ruangan";

    onConfirm({
      serviceId: selectedProduct.id,
      name: selectedProduct.name,
      unitPrice: Number(selectedProduct.price || 0),
      staffId: effectiveStaffId,
      staffName,
      roomId: effectiveRoomId,
      roomName,
    });
    onClose();
  };

  return (
    <Dialog open={!!parentItem} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[430px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Lanjut Servis (1 Sesi)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
            <div className="font-semibold text-foreground">{parentItem?.name}</div>
            <div className="text-muted-foreground">
              Ruangan: <span className="font-medium text-foreground">{parentItem?.roomName || "-"}</span>
              {" · "}
              Terapis awal: <span className="font-medium text-foreground">{parentItem?.staffName || "-"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Layanan Lanjutan
            </Label>
            <ProductCombobox
              branchId={branchId}
              value={selectedServiceId}
              onChange={setSelectedServiceId}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="same-staff-addon"
                checked={sameStaff}
                onCheckedChange={(checked) => setSameStaff(checked === true)}
              />
              <label htmlFor="same-staff-addon" className="text-sm font-medium cursor-pointer">
                Terapis sama ({parentItem?.staffName || "Terapis awal"})
              </label>
            </div>

            {!sameStaff && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pilih Terapis Pengganti
                </Label>
                <StaffCombobox
                  serviceId={selectedServiceId || undefined}
                  value={selectedStaffId}
                  onChange={setSelectedStaffId}
                  branchId={branchId}
                />
              </div>
            )}
          </div>

          {rooms.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="same-room-addon"
                  checked={sameRoom}
                  onCheckedChange={(checked) => setSameRoom(checked === true)}
                />
                <label htmlFor="same-room-addon" className="text-sm font-medium cursor-pointer">
                  Ruangan sama ({parentItem?.roomName || "Ruangan awal"})
                </label>
              </div>

              {!sameRoom && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pilih Ruangan Tujuan
                  </Label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Ruangan" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedProduct || !effectiveStaffId || !effectiveRoomId}
          >
            Tambahkan ke Sesi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
