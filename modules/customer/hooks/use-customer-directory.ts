"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getCustomerDirectoryAction } from "../actions/customer-action";

export interface CustomerDirectoryItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  activeVoucherCount: number;
  transactionCount: number;
  bookingCount: number;
}

export function useCustomerDirectory(initialData: CustomerDirectoryItem[], initialTotal: number) {
  const [customers, setCustomers] = useState<CustomerDirectoryItem[]>(initialData);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil(initialTotal / 20)));
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomers = useCallback(async (searchQuery: string, targetPage: number) => {
    setIsLoading(true);
    const res = await getCustomerDirectoryAction(searchQuery, targetPage, 20);
    setIsLoading(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    if (res.data) {
      setCustomers(res.data);
      setTotal(res.metadata?.total ?? res.data.length);
      setTotalPages(res.metadata?.totalPages ?? 1);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== "" || page !== 1) {
        fetchCustomers(query, page);
      } else {
        fetchCustomers("", 1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, page, fetchCustomers]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return {
    customers,
    query,
    page,
    total,
    totalPages,
    isLoading,
    setPage,
    handleSearchChange,
  };
}
