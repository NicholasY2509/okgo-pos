"use client";

import { useMemo, useState } from "react";
import { DoorOpen, Search, Sparkles, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStaffCombobox } from "@/modules/staff/hooks/use-staff-combobox";
import type { CartItem } from "../../stores/pos-store";
import {
  type RoomOption,
  RoomSelectionList,
  SelectionTriggerCard,
  type ServiceOption,
  ServiceSelectionList,
  type StaffOption,
  TherapistSelectionList,
} from "../selection-panel-lists";

type ActivePanel = "service" | "therapist" | "room" | null;

interface AddonServiceDialogProps {
  parentItem: CartItem | null;
  onClose: () => void;
  products: ServiceOption[];
  staff: StaffOption[];
  rooms?: RoomOption[];
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
  const isVipSession = Boolean(parentItem?.isVip);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [sameStaff, setSameStaff] = useState<boolean>(true);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [sameRoom, setSameRoom] = useState<boolean>(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [panelSearch, setPanelSearch] = useState<string>("");

  const { staffList, loading: staffLoading } = useStaffCombobox(
    branchId,
    selectedServiceId || undefined,
    undefined,
    undefined,
    true
  );

  const serviceProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products]
  );

  const filteredRooms = useMemo(
    () => rooms.filter((r) => (isVipSession ? Boolean(r.isVip) : !r.isVip)),
    [rooms, isVipSession]
  );

  const selectedProduct = useMemo(
    () => serviceProducts.find((p) => p.id === selectedServiceId),
    [serviceProducts, selectedServiceId]
  );

  const selectedStaff = useMemo(
    () =>
      staffList.find((s) => s.id === selectedStaffId) ||
      staff.find((s) => s.id === selectedStaffId),
    [staffList, staff, selectedStaffId]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const searchedServices = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) return serviceProducts;
    return serviceProducts.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const category = (p.category?.name ?? "").toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [serviceProducts, panelSearch]);

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

  const resetState = () => {
    setSelectedServiceId("");
    setSameStaff(true);
    setSelectedStaffId("");
    setSameRoom(true);
    setSelectedRoomId("");
    setActivePanel(null);
    setPanelSearch("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleTogglePanel = (panel: Exclude<ActivePanel, null>) => {
    setPanelSearch("");
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleSameStaffChange = (checked: boolean) => {
    setSameStaff(checked);
    if (checked && activePanel === "therapist") {
      setActivePanel(null);
      setPanelSearch("");
    }
  };

  const handleSameRoomChange = (checked: boolean) => {
    setSameRoom(checked);
    if (checked && activePanel === "room") {
      setActivePanel(null);
      setPanelSearch("");
    }
  };

  const effectiveStaffId = sameStaff ? parentItem?.staffId || "" : selectedStaffId;
  const effectiveRoomId = sameRoom ? parentItem?.roomId || "" : selectedRoomId;

  const handleConfirm = () => {
    if (!selectedProduct || !effectiveStaffId || !effectiveRoomId) return;
    const foundStaff =
      staffList.find((s) => s.id === effectiveStaffId) ||
      staff.find((s) => s.id === effectiveStaffId);
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
    handleClose();
  };

  const panelTitle =
    activePanel === "service"
      ? "Daftar Layanan"
      : activePanel === "therapist"
        ? "Daftar Terapis"
        : isVipSession
          ? "Daftar Ruangan VIP"
          : "Daftar Ruangan";

  const panelPlaceholder =
    activePanel === "service"
      ? "Cari layanan..."
      : activePanel === "therapist"
        ? "Cari terapis..."
        : "Cari ruangan...";

  return (
    <Dialog open={!!parentItem} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        className={cn(
          "p-0 gap-0 overflow-hidden transition-all duration-200 max-h-[90vh]",
          activePanel ? "sm:max-w-[760px]" : "sm:max-w-[440px]"
        )}
      >
        <div
          className={cn(
            "grid min-h-0",
            activePanel ? "grid-cols-1 md:grid-cols-[360px_1fr]" : "grid-cols-1"
          )}
        >
          {/* Left Panel: Parent Session Info & Selection Cards */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Lanjut Servis (1 Sesi)
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-5">
                <div className="p-3 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                  <div className="font-semibold text-foreground">{parentItem?.name}</div>
                  <div className="text-muted-foreground">
                    Ruangan:{" "}
                    <span className="font-medium text-foreground">
                      {parentItem?.roomName || "-"}
                    </span>
                    {" · "}
                    Terapis awal:{" "}
                    <span className="font-medium text-foreground">
                      {parentItem?.staffName || "-"}
                    </span>
                  </div>
                </div>

                {/* Service Selection Card */}
                <SelectionTriggerCard
                  active={activePanel === "service"}
                  selected={Boolean(selectedProduct)}
                  icon={<Sparkles className="w-5 h-5" />}
                  label="Layanan Lanjutan"
                  value={selectedProduct?.name}
                  subtitle={
                    selectedProduct
                      ? `${selectedProduct.duration ? `${selectedProduct.duration} menit · ` : ""}Rp ${Number(selectedProduct.price || 0).toLocaleString("id-ID")}`
                      : undefined
                  }
                  placeholder="Pilih Layanan"
                  onClick={() => handleTogglePanel("service")}
                />

                {/* Therapist Section */}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same-staff-addon"
                      checked={sameStaff}
                      onCheckedChange={(checked) => handleSameStaffChange(checked === true)}
                    />
                    <label
                      htmlFor="same-staff-addon"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Terapis sama ({parentItem?.staffName || "Terapis awal"})
                    </label>
                  </div>

                  {!sameStaff && (
                    <SelectionTriggerCard
                      active={activePanel === "therapist"}
                      selected={Boolean(selectedStaff)}
                      icon={<User className="w-5 h-5" />}
                      label="Terapis Pengganti"
                      value={
                        selectedStaff
                          ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
                          : undefined
                      }
                      placeholder="Pilih Terapis"
                      onClick={() => handleTogglePanel("therapist")}
                    />
                  )}
                </div>

                {/* Room Section */}
                {rooms.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="same-room-addon"
                        checked={sameRoom}
                        onCheckedChange={(checked) => handleSameRoomChange(checked === true)}
                      />
                      <label
                        htmlFor="same-room-addon"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Ruangan sama ({parentItem?.roomName || "Ruangan awal"})
                      </label>
                    </div>

                    {!sameRoom && (
                      <SelectionTriggerCard
                        active={activePanel === "room"}
                        selected={Boolean(selectedRoom)}
                        icon={<DoorOpen className="w-5 h-5" />}
                        label={`Ruangan Tujuan ${isVipSession ? "(VIP)" : ""}`}
                        value={
                          selectedRoom
                            ? `${selectedRoom.name} ${selectedRoom.isVip ? "(VIP)" : ""}`
                            : undefined
                        }
                        placeholder={
                          isVipSession ? "Pilih Ruangan VIP" : "Pilih Ruangan Tujuan"
                        }
                        onClick={() => handleTogglePanel("room")}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedProduct || !effectiveStaffId || !effectiveRoomId}
              >
                Tambahkan ke Sesi
              </Button>
            </div>
          </div>

          {/* Right Panel: Searchable Card List */}
          {activePanel && (
            <div className="border-t md:border-t-0 md:border-l border-border bg-muted/30 flex flex-col h-[360px] md:h-[480px] min-h-0 overflow-hidden">
              <div className="p-4 pr-12 border-b border-border space-y-3 bg-card/50 shrink-0">
                <h3 className="font-semibold text-foreground">{panelTitle}</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={panelPlaceholder}
                    value={panelSearch}
                    onChange={(e) => setPanelSearch(e.target.value)}
                    className="pl-9 h-9 bg-background"
                  />
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-4">
                {activePanel === "service" ? (
                  <ServiceSelectionList
                    services={searchedServices}
                    selectedServiceId={selectedServiceId}
                    onSelect={setSelectedServiceId}
                  />
                ) : activePanel === "therapist" ? (
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
                    isVip={isVipSession}
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
