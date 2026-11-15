"use client";

import type { ReactNode } from "react";
import { Check, ChevronRight, DoorOpen, Loader2, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffOption {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  isAvailable?: boolean;
  unavailableReason?: string | null;
  workPosition?: { name?: string | null } | null;
  attendances?: Array<{ clockIn?: string | Date | null }>;
}

export interface RoomOption {
  id: string;
  name: string;
  isVip?: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  price?: number | string | null;
  duration?: number | null;
  image?: string | null;
  isActive?: boolean;
  isVip?: boolean;
  category?: { name?: string | null } | null;
}

interface SelectionTriggerCardProps {
  active: boolean;
  selected: boolean;
  icon: ReactNode;
  label: string;
  value?: string;
  placeholder: string;
  subtitle?: string;
  onClick: () => void;
}

export function SelectionTriggerCard({
  active,
  selected,
  icon,
  label,
  value,
  placeholder,
  subtitle,
  onClick,
}: SelectionTriggerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-3.5 rounded-lg border transition-all flex items-center gap-3",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-accent/50"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {value ? (
          <>
            <p className="font-semibold text-foreground truncate">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        )}
      </div>
      <ChevronRight
        className={cn(
          "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
          active && "text-primary rotate-90 md:rotate-0"
        )}
      />
    </button>
  );
}

interface TherapistSelectionListProps {
  staffList: StaffOption[];
  loading: boolean;
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
}

export function TherapistSelectionList({
  staffList,
  loading,
  selectedStaffId,
  onSelect,
}: TherapistSelectionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Memuat terapis...</span>
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
        <User className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">Terapis tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {staffList.map((s) => {
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
              onSelect(isSelected ? "" : s.id);
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
  );
}

interface RoomSelectionListProps {
  rooms: RoomOption[];
  selectedRoomId: string;
  isVip?: boolean;
  onSelect: (roomId: string) => void;
}

export function RoomSelectionList({
  rooms,
  selectedRoomId,
  isVip = false,
  onSelect,
}: RoomSelectionListProps) {
  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
        <DoorOpen className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">
          {isVip ? "Tidak ada ruangan VIP aktif." : "Tidak ada ruangan reguler aktif."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {rooms.map((r) => {
        const isSelected = selectedRoomId === r.id;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(isSelected ? "" : r.id)}
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
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
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
  );
}

interface ServiceSelectionListProps {
  services: ServiceOption[];
  selectedServiceId: string;
  onSelect: (serviceId: string) => void;
}

export function ServiceSelectionList({
  services,
  selectedServiceId,
  onSelect,
}: ServiceSelectionListProps) {
  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
        <Sparkles className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">Layanan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {services.map((p) => {
        const isSelected = selectedServiceId === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(isSelected ? "" : p.id)}
            className={cn(
              "p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 bg-card",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:bg-accent/50"
            )}
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {p.name}
                </p>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </div>
              {p.category?.name && (
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5 truncate">
                  {p.category.name}
                </p>
              )}
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {p.duration ? `${p.duration} menit` : "-"}
                </span>
                <span className="font-semibold text-primary">
                  Rp {Number(p.price || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
