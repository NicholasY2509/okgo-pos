"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronRight, DoorOpen, Loader2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStaffCombobox } from "../../staff/hooks/use-staff-combobox";

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
                  <button
                    type="button"
                    onClick={() => handleTogglePanel("therapist")}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-3",
                      activePanel === "therapist"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        selectedStaff
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">Terapis</p>
                      {selectedStaff ? (
                        <p className="font-semibold text-foreground truncate">
                          {selectedStaff.firstName} {selectedStaff.lastName}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Pilih Terapis</p>
                      )}
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                        activePanel === "therapist" && "text-primary rotate-90 md:rotate-0"
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePanel("room")}
                    className={cn(
                      "w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-3",
                      activePanel === "room"
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-accent/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        selectedRoom
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Ruangan {isVipUpgrade ? "(VIP)" : ""}
                      </p>
                      {selectedRoom ? (
                        <p className="font-semibold text-foreground truncate">
                          {selectedRoom.name} {selectedRoom.isVip ? "(VIP)" : ""}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isVipUpgrade ? "Pilih Ruangan VIP" : "Pilih Ruangan"}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                        activePanel === "room" && "text-primary rotate-90 md:rotate-0"
                      )}
                    />
                  </button>
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
                  staffLoading ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memuat terapis...</span>
                    </div>
                  ) : searchedStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                      <User className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">Terapis tidak ditemukan.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {searchedStaff.map((s) => {
                        const isSelected = selectedStaffId === s.id;
                        const isAvailable = s.isAvailable !== false;
                        const initials = `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase();
                        const clockIn = s.attendances?.[0]?.clockIn;

                        return (
                          <button
                            key={s.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                              if (!isAvailable) return;
                              setSelectedStaffId(isSelected ? "" : s.id);
                            }}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 bg-card",
                              !isAvailable
                                ? "opacity-75 cursor-not-allowed bg-muted/50 border-border"
                                : isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                                  : "border-border hover:bg-accent/50"
                            )}
                          >
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {initials || <User className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {s.firstName} {s.lastName}
                                </p>
                                {isSelected && isAvailable && (
                                  <Check className="w-4 h-4 text-primary shrink-0" />
                                )}
                              </div>
                              {s.workPosition?.name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {s.workPosition.name}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                {clockIn ? (
                                  <span className="inline-block text-[10px] text-green-600 font-medium bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-sm">
                                    Hadir{" "}
                                    {new Date(clockIn).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                ) : (
                                  <span className="inline-block text-[10px] text-muted-foreground italic">
                                    Belum Hadir
                                  </span>
                                )}
                              </div>
                              {!isAvailable && s.unavailableReason && (
                                <p className="mt-1 text-[11px] font-medium text-destructive leading-tight">
                                  {s.unavailableReason}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : searchedRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
                    <DoorOpen className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm">
                      {isVipUpgrade
                        ? "Tidak ada ruangan VIP aktif."
                        : "Tidak ada ruangan reguler aktif."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {searchedRooms.map((r) => {
                      const isSelected = selectedRoomId === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRoomId(isSelected ? "" : r.id)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 bg-card",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-accent/50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {r.name}
                              </p>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary shrink-0" />
                              )}
                            </div>
                            <span
                              className={cn(
                                "inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm",
                                r.isVip
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {r.isVip ? "VIP" : "Reguler"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
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
