"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { getStaffIncentiveDetailsAction } from "../actions/staff-incentive-action";
import { format } from "date-fns";

export function StaffIncentiveDetailsTable({
  staffId,
  type,
  startDate,
  endDate,
}: {
  staffId: string;
  type: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, limit: 10 });

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await getStaffIncentiveDetailsAction({ staffId, type, startDate, endDate, page, limit: 10 });
        if (isMounted) {
          if (res.success) {
            setData(res.data || []);
            setPagination(res.pagination || { total: 0, totalPages: 0, limit: 10 });
          } else {
            console.error(res.error);
            // toast.error(res.error || "Gagal memuat detail");
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();
    return () => { isMounted = false; };
  }, [staffId, type, startDate, endDate, page]);

  if (loading) {
    return <div className="p-4 text-center text-sm text-slate-500">Memuat detail...</div>;
  }

  if (data.length === 0) {
    return <div className="p-4 text-center text-sm text-slate-500">Tidak ada detail yang ditemukan.</div>;
  }

  return (
    <div className="p-4 bg-muted/50 rounded-md border my-2">
      <h4 className="font-medium text-sm mb-3">Detail Transaksi</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Tanggal</TableHead>
            <TableHead className="text-xs">Item / Layanan</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">Pendapatan Kotor</TableHead>
            <TableHead className="text-xs text-right">Insentif</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: any) => (
            <TableRow key={item.id} className="text-sm bg-transparent hover:bg-transparent">
              <TableCell className="py-2 text-xs">
                {format(new Date(item.date), "dd MMM yyyy, HH:mm")}
              </TableCell>
              <TableCell className="py-2 text-xs">{item.itemName}</TableCell>
              <TableCell className="py-2 text-xs text-right">{item.quantity}</TableCell>
              <TableCell className="py-2 text-xs text-right">
                <NumericFormat
                  value={item.gross}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                />
              </TableCell>
              <TableCell className="py-2 text-xs text-right text-green-600 font-medium">
                <NumericFormat
                  value={item.incentive}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="Rp "
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => Math.max(old - 1, 1))}
            disabled={page === 1}
            className="h-7 px-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs text-slate-500">
            Hal {page} dari {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((old) => (old < pagination.totalPages ? old + 1 : old))}
            disabled={page === pagination.totalPages}
            className="h-7 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
