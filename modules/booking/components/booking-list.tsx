"use client";

import { useState, useMemo } from "react";
import { Search, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/data-table";
import { bookingColumns } from "./booking-columns";
export function BookingList({ initialBookings }: { initialBookings: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredBookings = useMemo(() => {
    return initialBookings.filter((booking) => {
      // Search term filter
      const matchesSearch =
        !searchTerm ||
        booking.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.customer?.name && booking.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date range filter
      let matchesDate = true;
      if (dateRange?.from) {
        let earliestTime: Date | null = null;
        const sessions = booking.items?.flatMap((item: any) => item.serviceSessions || []) || [];
        sessions.forEach((s: any) => {
          if (s.startTime) {
            const d = new Date(s.startTime);
            if (!earliestTime || d < earliestTime) {
              earliestTime = d;
            }
          }
        });

        // Use earliest session time for filtering, fallback to createdAt if no session
        const targetDate = earliestTime || new Date(booking.createdAt);

        if (targetDate < dateRange.from) {
          matchesDate = false;
        }
        if (dateRange.to) {
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (targetDate > end) {
            matchesDate = false;
          }
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [initialBookings, searchTerm, dateRange]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDateRange(undefined);
  };

  return (
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleResetFilter} title="Reset Filter">
              <FilterX className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <DataTable columns={bookingColumns} data={filteredBookings} emptyMessage="Belum ada booking yang sesuai kriteria." />
      </div>
    </div>
  );
}
