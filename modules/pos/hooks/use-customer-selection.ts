import { useState, useEffect, useCallback } from "react";
import { searchCustomersAction } from "../../customer/actions/customer-action";

export function useCustomerSelection(open: boolean, initialCustomers: any[] = []) {
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadCustomers = useCallback(async (query: string, pageNum: number, isNewSearch: boolean = false) => {
    setLoading(true);
    const result = await searchCustomersAction(query, pageNum, 15);

    if (result.success && result.data && result.metadata) {
      if (isNewSearch) {
        setCustomers(result.data);
      } else {
        setCustomers(prev => [...prev, ...result.data]);
      }
      setHasMore(result.metadata.hasMore);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setPage(1);
      loadCustomers(debouncedSearch, 1, true);
    }
  }, [debouncedSearch, loadCustomers, open]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadCustomers(debouncedSearch, nextPage, false);
      }
    }
  };

  return {
    customers,
    searchQuery,
    setSearchQuery,
    loading,
    page,
    handleScroll
  };
}
