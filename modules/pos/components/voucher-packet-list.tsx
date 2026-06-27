"use client";

import { useState, useMemo } from "react";
import { Ticket, Search } from "lucide-react";
import { VoucherPacketCard } from "./voucher-packet-card";
import { Input } from "@/components/ui/input";

interface VoucherPacketListProps {
  voucherPackets: any[];
  onVoucherPacketClick: (packet: any) => void;
}

export function VoucherPacketList({ voucherPackets, onVoucherPacketClick }: VoucherPacketListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPackets = useMemo(() => {
    return voucherPackets.filter((vp) => 
      vp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [voucherPackets, searchQuery]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">Paket Voucher</h3>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari paket voucher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPackets.map((vp) => (
          <VoucherPacketCard
            key={vp.id}
            packet={vp}
            onClick={() => onVoucherPacketClick(vp)}
          />
        ))}
        {filteredPackets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
            <Ticket className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada paket voucher yang ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
