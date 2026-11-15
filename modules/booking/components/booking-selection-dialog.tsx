"use client";

import { useMemo, useState } from "react";
import { Check, Search, Sparkles, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useStaffCombobox } from "@/modules/staff/hooks/use-staff-combobox";
import {
  SelectionTriggerCard,
  type ServiceOption,
  ServiceSelectionList,
  type StaffOption,
  TherapistSelectionList,
} from "@/modules/pos/components/selection-panel-lists";

type ActivePanel = "service" | "therapist" | null;

interface BookingSelectionDialogProps {
  open: boolean;
  index: number;
  totalCount: number;
  branchId: string;
  startTime?: Date;
  services: ServiceOption[];
  staffList: StaffOption[];
  initialServiceId: string;
  initialStaffId?: string;
  onClose: () => void;
  onSave: (serviceId: string, staffId?: string) => void;
}

export function BookingSelectionDialog({
  open,
  index,
  totalCount,
  branchId,
  startTime,
  services,
  staffList: fallbackStaffList,
  initialServiceId,
  initialStaffId,
  onClose,
  onSave,
}: BookingSelectionDialogProps) {
  const [serviceId, setServiceId] = useState(initialServiceId || "");
  const [staffId, setStaffId] = useState(initialStaffId || "");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [panelSearch, setPanelSearch] = useState("");

  const { staffList, loading: staffLoading } = useStaffCombobox(
    branchId,
    serviceId || undefined,
    undefined,
    startTime,
    true
  );

  const activeServices = useMemo(
    () => services.filter((p) => p.isActive !== false),
    [services]
  );

  const selectedProduct = useMemo(
    () => activeServices.find((p) => p.id === serviceId),
    [activeServices, serviceId]
  );

  const selectedStaff = useMemo(
    () =>
      staffList.find((s) => s.id === staffId) ||
      fallbackStaffList.find((s) => s.id === staffId),
    [staffList, fallbackStaffList, staffId]
  );

  const searchedServices = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) return activeServices;
    return activeServices.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const category = (p.category?.name ?? "").toLowerCase();
      return name.includes(query) || category.includes(query);
    });
  }, [activeServices, panelSearch]);

  const searchedStaff = useMemo(() => {
    const query = panelSearch.trim().toLowerCase();
    if (!query) return staffList;
    return staffList.filter((s) => {
      const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase();
      const position = (s.workPosition?.name ?? "").toLowerCase();
      return fullName.includes(query) || position.includes(query);
    });
  }, [staffList, panelSearch]);

  const handleTogglePanel = (panel: Exclude<ActivePanel, null>) => {
    setPanelSearch("");
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleSave = () => {
    if (!serviceId) return;
    onSave(serviceId, staffId || undefined);
    onClose();
  };

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
                  Atur Layanan{totalCount > 1 ? ` ${index + 1}` : ""}
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
                  label="Terapis (Opsional)"
                  value={
                    selectedStaff
                      ? `${selectedStaff.firstName} ${selectedStaff.lastName}`
                      : undefined
                  }
                  placeholder="Siapa saja (Opsional)"
                  onClick={() => handleTogglePanel("therapist")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button type="button" onClick={handleSave} disabled={!serviceId}>
                Simpan
              </Button>
            </div>
          </div>

          {/* Right Panel */}
          {activePanel && (
            <div className="border-t md:border-t-0 md:border-l border-border bg-muted/30 flex flex-col h-[360px] md:h-[460px] min-h-0 overflow-hidden">
              <div className="p-4 pr-12 border-b border-border space-y-3 bg-card/50 shrink-0">
                <h3 className="font-semibold text-foreground">
                  {activePanel === "service" ? "Daftar Layanan" : "Daftar Terapis"}
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      activePanel === "service" ? "Cari layanan..." : "Cari terapis..."
                    }
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
                ) : (
                  <div className="space-y-2.5">
                    {!panelSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => setStaffId("")}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-2.5 bg-card",
                          !staffId
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                            !staffId
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-semibold text-sm text-foreground">
                              Siapa saja (Opsional)
                            </p>
                            {!staffId && (
                              <Check className="w-4 h-4 text-primary shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Terapis akan ditentukan saat penjadwalan
                          </p>
                        </div>
                      </button>
                    )}
                    <TherapistSelectionList
                      staffList={searchedStaff}
                      loading={staffLoading}
                      selectedStaffId={staffId}
                      onSelect={setStaffId}
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
