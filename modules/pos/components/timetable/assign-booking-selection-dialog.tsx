"use client";

import { useMemo, useState } from "react";
import { Check, DoorOpen, Search, Sparkles, Ticket, User, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useStaffCombobox } from "@/modules/staff/hooks/use-staff-combobox";
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

export interface BookingSelectionValue {
  serviceId: string;
  staffId: string;
  roomId?: string;
  isVip?: boolean;
  discountAmount?: number;
  customerVoucherId?: string;
  voucherCode?: string;
}

interface AssignBookingSelectionDialogProps {
  open: boolean;
  visitorIndex: number;
  branchId: string;
  startTime?: Date;
  products: ServiceOption[];
  staff: StaffOption[];
  rooms: RoomOption[];
  initialValue: BookingSelectionValue;
  onClose: () => void;
  onSave: (value: BookingSelectionValue) => void;
  onRemoveVoucher: () => void;
}

export function AssignBookingSelectionDialog({
  open,
  visitorIndex,
  branchId,
  startTime,
  products,
  staff,
  rooms,
  initialValue,
  onClose,
  onSave,
  onRemoveVoucher,
}: AssignBookingSelectionDialogProps) {
  const [serviceId, setServiceId] = useState(initialValue.serviceId || "");
  const [staffId, setStaffId] = useState(initialValue.staffId || "");
  const [roomId, setRoomId] = useState(initialValue.roomId || "auto");
  const [isVip, setIsVip] = useState(Boolean(initialValue.isVip));
  const [discountAmount, setDiscountAmount] = useState<number>(
    Number(initialValue.discountAmount || 0)
  );
  const [customerVoucherId, setCustomerVoucherId] = useState(
    initialValue.customerVoucherId
  );
  const [voucherCode, setVoucherCode] = useState(initialValue.voucherCode);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [panelSearch, setPanelSearch] = useState("");

  const { staffList, loading: staffLoading } = useStaffCombobox(
    branchId,
    serviceId || undefined,
    undefined,
    startTime,
    true
  );

  const serviceProducts = useMemo(
    () => products.filter((p) => p.isActive !== false),
    [products]
  );

  const filteredRooms = useMemo(
    () => rooms.filter((r) => (isVip ? Boolean(r.isVip) : !r.isVip)),
    [rooms, isVip]
  );

  const selectedProduct = useMemo(
    () => serviceProducts.find((p) => p.id === serviceId),
    [serviceProducts, serviceId]
  );

  const selectedStaff = useMemo(
    () =>
      staffList.find((s) => s.id === staffId) ||
      staff.find((s) => s.id === staffId),
    [staffList, staff, staffId]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId]
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

  const handleTogglePanel = (panel: Exclude<ActivePanel, null>) => {
    setPanelSearch("");
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleVipChange = (checked: boolean) => {
    setIsVip(checked);
    if (roomId && roomId !== "auto") {
      const currentRoom = rooms.find((r) => r.id === roomId);
      if (currentRoom && Boolean(currentRoom.isVip) !== checked) {
        setRoomId("auto");
      }
    }
  };

  const handleClearVoucher = () => {
    setCustomerVoucherId(undefined);
    setVoucherCode(undefined);
    setDiscountAmount(0);
    onRemoveVoucher();
  };

  const handleSave = () => {
    onSave({
      serviceId,
      staffId,
      roomId: roomId || "auto",
      isVip,
      discountAmount,
      customerVoucherId,
      voucherCode,
    });
    onClose();
  };

  const panelTitle =
    activePanel === "service"
      ? "Daftar Layanan"
      : activePanel === "therapist"
        ? "Daftar Terapis"
        : isVip
          ? "Daftar Ruangan VIP"
          : "Daftar Ruangan";

  const panelPlaceholder =
    activePanel === "service"
      ? "Cari layanan..."
      : activePanel === "therapist"
        ? "Cari terapis..."
        : "Cari ruangan...";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
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
          {/* Left Panel */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Atur Layanan - Pengunjung {visitorIndex + 1}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-5">
                <SelectionTriggerCard
                  active={activePanel === "service"}
                  selected={Boolean(selectedProduct)}
                  icon={<Sparkles className="w-5 h-5" />}
                  label="Layanan"
                  value={selectedProduct?.name}
                  subtitle={
                    selectedProduct
                      ? `${selectedProduct.duration ? `${selectedProduct.duration} menit · ` : ""}Rp ${Number(selectedProduct.price || 0).toLocaleString("id-ID")}`
                      : undefined
                  }
                  placeholder="Pilih Layanan"
                  onClick={() => handleTogglePanel("service")}
                />

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
                  selected={roomId === "auto" || Boolean(selectedRoom)}
                  icon={<DoorOpen className="w-5 h-5" />}
                  label={`Ruangan ${isVip ? "(VIP)" : ""}`}
                  value={
                    roomId === "auto"
                      ? "Otomatis"
                      : selectedRoom
                        ? `${selectedRoom.name} ${selectedRoom.isVip ? "(VIP)" : ""}`
                        : "Otomatis"
                  }
                  placeholder="Otomatis"
                  onClick={() => handleTogglePanel("room")}
                />

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id={`dialog-assign-vip-${visitorIndex}`}
                    checked={isVip}
                    onCheckedChange={(checked) => handleVipChange(checked === true)}
                  />
                  <label
                    htmlFor={`dialog-assign-vip-${visitorIndex}`}
                    className="text-sm font-medium leading-none cursor-pointer text-amber-600"
                  >
                    Upgrade ke VIP (+ Rp 80.000)
                  </label>
                </div>

                {customerVoucherId ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Ticket className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Voucher: {voucherCode || "Layanan"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearVoucher}
                      className="hover:text-destructive shrink-0"
                      title="Hapus voucher"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Label
                      htmlFor={`dialog-assign-discount-${visitorIndex}`}
                      className="text-xs text-muted-foreground whitespace-nowrap"
                    >
                      Diskon Item (Rp)
                    </Label>
                    <Input
                      id={`dialog-assign-discount-${visitorIndex}`}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-9 w-36 text-right text-sm"
                      value={discountAmount || ""}
                      onChange={(e) => {
                        const val =
                          e.target.value === ""
                            ? 0
                            : Math.max(0, Number(e.target.value));
                        setDiscountAmount(val);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!serviceId || !staffId}
              >
                Simpan
              </Button>
            </div>
          </div>

          {/* Right Panel */}
          {activePanel && (
            <div className="border-t md:border-t-0 md:border-l border-border bg-muted/30 flex flex-col h-[360px] md:h-[500px] min-h-0 overflow-hidden">
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
                    selectedServiceId={serviceId}
                    onSelect={setServiceId}
                  />
                ) : activePanel === "therapist" ? (
                  <TherapistSelectionList
                    staffList={searchedStaff}
                    loading={staffLoading}
                    selectedStaffId={staffId}
                    onSelect={setStaffId}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {!panelSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => setRoomId("auto")}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 bg-card",
                          roomId === "auto"
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            roomId === "auto"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <DoorOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-sm text-foreground">
                              Otomatis
                            </p>
                            {roomId === "auto" && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Sistem memilihkan ruangan yang tersedia
                          </p>
                        </div>
                      </button>
                    )}
                    <RoomSelectionList
                      rooms={searchedRooms}
                      selectedRoomId={roomId}
                      isVip={isVip}
                      onSelect={(nextRoomId) => setRoomId(nextRoomId || "auto")}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
