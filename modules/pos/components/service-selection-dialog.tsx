"use client";

import { useState, useEffect, useMemo } from "react";
import { DoorOpen, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStaffCombobox } from "../../staff/hooks/use-staff-combobox";
import {
  RoomSelectionList,
  SelectionTriggerCard,
  TherapistSelectionList,
} from "./selection-panel-lists";

type ActivePanel = "therapist" | "room" | null;

interface ServiceSelectionDialogProps {
  selectedProduct: any | null;
  onClose: () => void;
  staff: any[];
  rooms: any[];
  branchId: string;
  onAddServiceToCart: (staffId: string, roomId: string, isVip?: boolean) => void;
}

export function ServiceSelectionDialog({
  selectedProduct,
  onClose,
  rooms,
  branchId,
  onAddServiceToCart,
}: ServiceSelectionDialogProps) {
  const [isVipUpgrade, setIsVipUpgrade] = useState<boolean>(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [panelSearch, setPanelSearch] = useState<string>("");

  const { staffList, loading: staffLoading } = useStaffCombobox(
    branchId,
    selectedProduct?.id,
    undefined,
    undefined,
    true
  );

  const filteredRooms = useMemo(
    () => rooms.filter((r) => (isVipUpgrade ? Boolean(r.isVip) : !r.isVip)),
    [rooms, isVipUpgrade]
  );

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId),
    [staffList, selectedStaffId]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const searchedStaff = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) return staffList;
    return staffList.filter((s) => {
      const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
      const position = (s.workPosition?.name ?? "").toLowerCase();
      return fullName.includes(query) || position.includes(query);
    });
  }, [staffList, panelSearch]);

  const searchedRooms = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) return filteredRooms;
    return filteredRooms.filter((r) =>
      (r.name ?? "").toLowerCase().includes(query)
    );
  }, [filteredRooms, panelSearch]);

  // Reset state when a new product is selected
  useEffect(() => {
    if (selectedProduct) {
      setIsVipUpgrade(false);
      setSelectedStaffId("");
      setSelectedRoomId("");
      setActivePanel(null);
      setPanelSearch("");
    }
  }, [selectedProduct]);

  const handleTogglePanel = (panel: Exclude<ActivePanel, null>) => {
    setPanelSearch("");
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

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
    <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden transition-all duration-200 max-h-[90vh]",
          activePanel ? "sm:max-w-[760px]" : "sm:max-w-[440px]"
        )}
      >
        <div className={cn("grid min-h-0", activePanel ? "grid-cols-1 md:grid-cols-[360px_1fr]" : "grid-cols-1")}>
          {/* Left Panel: Selected Service & 2 Selection Cards */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Pilih Terapis & Ruangan
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-5">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <Label className="text-primary text-xs font-bold uppercase tracking-wider mb-1 block">
                    Layanan Terpilih
                  </Label>
                  <p className="font-semibold text-foreground text-lg">
                    {selectedProduct?.name}
                  </p>
                </div>

                {/* 2 Cards: Pilih Terapis & Pilih Ruangan */}
                <div className="grid grid-cols-1 gap-3">
                  <SelectionTriggerCard
                    active={activePanel === "therapist"}
                    selected={Boolean(selectedStaff)}
                    icon={<User className="w-5 h-5" />}
                    label="Terapis"
                    value={
                      selectedStaff
                        ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
                        : undefined
                    }
                    placeholder="Pilih Terapis"
                    onClick={() => handleTogglePanel("therapist")}
                  />

                  <SelectionTriggerCard
                    active={activePanel === "room"}
                    selected={Boolean(selectedRoom)}
                    icon={<DoorOpen className="w-5 h-5" />}
                    label={`Ruangan ${isVipUpgrade ? "(VIP)" : ""}`}
                    value={
                      selectedRoom
                        ? `${selectedRoom.name} ${selectedRoom.isVip ? "(VIP)" : ""}`
                        : undefined
                    }
                    placeholder={isVipUpgrade ? "Pilih Ruangan VIP" : "Pilih Ruangan"}
                    onClick={() => handleTogglePanel("room")}
                  />
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
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedStaffId || !selectedRoomId}
              >
                Tambahkan
              </Button>
            </div>
          </div>

          {/* Right Panel: Item Cards List for Therapist or Room */}
          {activePanel && (
            <div className="border-t md:border-t-0 md:border-l border-border bg-muted/30 flex flex-col h-[360px] md:h-[460px] min-h-0 overflow-hidden">
              <div className="p-4 pr-12 border-b border-border space-y-3 bg-card/50 shrink-0">
                <h3 className="font-semibold text-foreground">
                  {activePanel === "therapist"
                    ? "Daftar Terapis"
                    : isVipUpgrade
                      ? "Daftar Ruangan VIP"
                      : "Daftar Ruangan"}
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      activePanel === "therapist" ? "Cari terapis..." : "Cari ruangan..."
                    }
                    value={panelSearch}
                    onChange={(e) => setPanelSearch(e.target.value)}
                    className="pl-9 h-9 bg-background"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4">
                {activePanel === "therapist" ? (
                  <TherapistSelectionList
                    staffList={searchedStaff}
                    loading={staffLoading}
                    selectedStaffId={selectedStaffId}
                    onSelect={setSelectedStaffId}
                  />
                ) : (
                  <RoomSelectionList
                    rooms={searchedRooms}
                    selectedRoomId={selectedRoomId}
                    isVip={isVipUpgrade}
                    onSelect={setSelectedRoomId}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
