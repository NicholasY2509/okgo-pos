"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, FilterX, History, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/data-table";
import { getBookingColumns } from "./booking-columns";
import { BookingDetailDialog } from "./booking-detail-dialog";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export function BookingList({ 
  initialBookings,
  initialFilters 
}: { 
  initialBookings: any[];
  initialFilters: { search: string; from?: Date; to?: Date; isHistory: boolean }
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialFilters.search);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: initialFilters.from,
    to: initialFilters.to,
  });
  const [isHistory, setIsHistory] = useState(initialFilters.isHistory);

  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const columns = useMemo(() => getBookingColumns(handleViewDetail), []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      let changed = false;

      if (searchTerm && params.get('search') !== searchTerm) {
        params.set('search', searchTerm);
        changed = true;
      } else if (!searchTerm && params.has('search')) {
        params.delete('search');
        changed = true;
      }

      const fromStr = dateRange?.from?.toISOString();
      if (fromStr && params.get('from') !== fromStr) {
        params.set('from', fromStr);
        changed = true;
      } else if (!fromStr && params.has('from')) {
        params.delete('from');
        changed = true;
      }

      const toStr = dateRange?.to?.toISOString();
      if (toStr && params.get('to') !== toStr) {
        params.set('to', toStr);
        changed = true;
      } else if (!toStr && params.has('to')) {
        params.delete('to');
        changed = true;
      }

      const historyStr = isHistory ? 'true' : null;
      if (historyStr && params.get('history') !== historyStr) {
        params.set('history', historyStr);
        changed = true;
      } else if (!historyStr && params.has('history')) {
        params.delete('history');
        changed = true;
      }

      if (changed) {
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, dateRange, isHistory, pathname, router, searchParams]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setIsHistory(false);
  };

  return (
    <>
      <div className="space-y-4 mt-2">
        <div className="bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Pencarian</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari No. Booking atau Pelanggan..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 w-full md:w-[260px]">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Jadwal Booking</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleResetFilter} title="Reset Filter">
                <FilterX className="w-4 h-4" />
              </Button>
              <Button 
                type="button" 
                variant={isHistory ? "default" : "outline"} 
                onClick={() => setIsHistory(!isHistory)} 
                title={isHistory ? "Tampilkan Booking Aktif" : "Tampilkan Riwayat Booking"}
              >
                {isHistory ? <LayoutList className="w-4 h-4 mr-2" /> : <History className="w-4 h-4 mr-2" />}
                {isHistory ? "Booking Aktif" : "Riwayat"}
              </Button>
            </div>
          </div>
        </div>

        <DataTable columns={columns} data={initialBookings} emptyMessage={isHistory ? "Belum ada riwayat booking." : "Belum ada booking yang sesuai kriteria."} />
      </div>

      <BookingDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        booking={selectedBooking}
      />
    </>
  );
}
