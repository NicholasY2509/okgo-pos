import { Ticket } from "lucide-react";

interface VoucherPacketCardProps {
  packet: any;
  onClick: () => void;
}

export function VoucherPacketCard({ packet, onClick }: VoucherPacketCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col bg-card border border-border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 hover:ring-1 hover:ring-primary/20 overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
        <Ticket className="w-12 h-12 text-primary" />
      </div>

      <h4 className="font-bold text-foreground text-sm mb-3 z-10 leading-tight group-hover:text-primary transition-colors">
        {packet.name}
      </h4>

      <div className="mt-auto z-10">
        <div className="flex flex-col gap-1 mb-3">
          {packet.totalVisitCount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary w-fit">
              {packet.totalVisitCount} Sesi
            </span>
          )}
          {packet.totalCreditAmount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary w-fit">
              Kredit Rp {Number(packet.totalCreditAmount).toLocaleString('id-ID')}
            </span>
          )}
        </div>
        <p className="text-primary font-extrabold text-lg">
          Rp {Number(packet.price).toLocaleString('id-ID')}
        </p>
      </div>
    </div>
  );
}
