import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { getBranchTransactionsAction } from "../actions/transaction-action";

interface UseTransactionsProps {
  branchId: string;
}

export function useTransactions({ branchId }: UseTransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalTransactions: 0, totalSales: 0, totalDiscounts: 0 });

  const fetchTransactions = async () => {
    setLoading(true);
    const filters: any = { branchId, page, limit };
    
    if (searchTerm) filters.search = searchTerm;
    if (dateRange?.from) filters.startDate = dateRange.from;
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      filters.endDate = end;
    }

    const result = await getBranchTransactionsAction(filters);
    if (result.success && result.data) {
      setTransactions(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
      if (result.summary) {
        setSummary(result.summary);
      }
    } else {
      toast.error(result.error || "Gagal memuat transaksi");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTransactions();
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, searchTerm, dateRange, page, limit]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setPage(1);
    // The useEffect will trigger the fetch because of state changes
  };

  return {
    transactions,
    loading,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    page,
    setPage,
    limit,
    setLimit,
    pagination,
    summary,
    handleResetFilter,
    refresh: fetchTransactions
  };
}
