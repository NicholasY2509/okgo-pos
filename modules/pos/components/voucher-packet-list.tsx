import { Ticket } from "lucide-react";
import { VoucherPacketCard } from "./voucher-packet-card";

interface VoucherPacketListProps {
  voucherPackets: any[];
  onVoucherPacketClick: (packet: any) => void;
}

export function VoucherPacketList({ voucherPackets, onVoucherPacketClick }: VoucherPacketListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Paket Voucher</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {voucherPackets.map((vp) => (
          <VoucherPacketCard
            key={vp.id}
            packet={vp}
            onClick={() => onVoucherPacketClick(vp)}
          />
        ))}
        {voucherPackets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
            <Ticket className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada paket voucher tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
