import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBranchTransactionsAction } from "../actions/transaction-action";

interface UseTransactionsProps {
  branchId?: string;
}

export function useTransactions({ branchId }: UseTransactionsProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalTransactions: 0, totalSales: 0, totalDiscounts: 0 });

  const fetchTransactions = async () => {
    setLoading(true);
    const filters: any = { branchId, page, limit };

    if (searchTerm) filters.search = searchTerm;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filters.startDate = start;
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
  }, [branchId, searchTerm, date, page, limit]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDate(new Date());
    setPage(1);
  };

  return {
    transactions,
    loading,
    searchTerm,
    setSearchTerm,
    date,
    setDate,
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
