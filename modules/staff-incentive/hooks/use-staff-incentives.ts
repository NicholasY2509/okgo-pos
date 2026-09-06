import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { getIncentivesAction } from "../actions/staff-incentive-action";

export function useStaffIncentives() {
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const fetchIncentives = async () => {
    setLoading(true);
    const filters: any = { page, limit };

    if (searchTerm) filters.search = searchTerm;
    if (dateRange?.from) filters.startDate = dateRange.from;
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      filters.endDate = end;
    }

    const result = await getIncentivesAction(filters);
    if (result.success && result.data) {
      setIncentives(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } else {
      toast.error(result.error || "Gagal memuat insentif");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchIncentives();
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dateRange, page, limit]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setPage(1);
  };

  return {
    incentives,
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
    handleResetFilter,
  };
}
