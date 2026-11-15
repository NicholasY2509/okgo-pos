"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  getCustomerActivitiesAction,
  getCustomerVouchersPaginatedAction,
} from "../actions/customer-action";

export interface CustomerVoucherItem {
  id: string;
  code: string;
  status: string;
  initialVisitCount: number | null;
  remainingVisitCount: number | null;
  initialCreditAmount: number | null;
  remainingCreditAmount: number | null;
  expiresAt: string | null;
  createdAt: string;
  voucherPacket: {
    id: string;
    name: string;
    price: number;
    totalVisitCount: number | null;
    totalCreditAmount: number | null;
    productName: string | null;
  };
  redemptions: Array<{
    id: string;
    redeemedVisitCount: number | null;
    redeemedAmount: number | null;
    redeemedAt: string;
    transactionNumber: string | null;
    transactionStatus: string | null;
  }>;
}

export interface CustomerActivityItem {
  id: string;
  kind: "TRANSACTION" | "SESSION" | "BOOKING";
  date: string;
  title: string;
  status: string;
  payload: any;
}

export interface CustomerDetailData {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    createdAt: string;
  };
  counts: {
    activeVoucherCount: number;
    totalVoucherCount: number;
    transactionCount: number;
    bookingCount: number;
    serviceSessionCount: number;
  };
  initialVouchers: {
    data: CustomerVoucherItem[];
    metadata: { total: number; page: number; limit: number; totalPages: number };
  };
  initialActivities: {
    data: CustomerActivityItem[];
    metadata: { total: number; page: number; limit: number; totalPages: number };
  };
}

export function useCustomerDetail(data: CustomerDetailData) {
  const customerId = data.customer.id;

  // Vouchers state
  const [vouchers, setVouchers] = useState<CustomerVoucherItem[]>(data.initialVouchers.data);
  const [voucherFilter, setVoucherFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [voucherPage, setVoucherPage] = useState(1);
  const [voucherTotal, setVoucherTotal] = useState(data.initialVouchers.metadata.total);
  const [voucherTotalPages, setVoucherTotalPages] = useState(data.initialVouchers.metadata.totalPages);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  // Activities state
  const [activities, setActivities] = useState<CustomerActivityItem[]>(data.initialActivities.data);
  const [activityFilter, setActivityFilter] = useState<"ALL" | "TRANSACTION" | "SESSION" | "BOOKING">("ALL");
  const [activityDate, setActivityDate] = useState<Date | undefined>(undefined);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(data.initialActivities.metadata.total);
  const [activityTotalPages, setActivityTotalPages] = useState(data.initialActivities.metadata.totalPages);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const isFirstVoucherRender = useRef(true);
  const isFirstActivityRender = useRef(true);

  const fetchVouchers = useCallback(
    async (filter: "ALL" | "ACTIVE" | "INACTIVE", page: number) => {
      setIsLoadingVouchers(true);
      const res = await getCustomerVouchersPaginatedAction({
        customerId,
        statusFilter: filter,
        page,
        limit: 10,
      });
      setIsLoadingVouchers(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.data && res.metadata) {
        setVouchers(res.data);
        setVoucherTotal(res.metadata.total);
        setVoucherTotalPages(res.metadata.totalPages);
      }
    },
    [customerId]
  );

  const fetchActivities = useCallback(
    async (
      type: "ALL" | "TRANSACTION" | "SESSION" | "BOOKING",
      date: Date | undefined,
      page: number
    ) => {
      setIsLoadingActivities(true);
      const res = await getCustomerActivitiesAction({
        customerId,
        type,
        date: date ? format(date, "yyyy-MM-dd") : undefined,
        page,
        limit: 10,
      });
      setIsLoadingActivities(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.data && res.metadata) {
        setActivities(res.data);
        setActivityTotal(res.metadata.total);
        setActivityTotalPages(res.metadata.totalPages);
      }
    },
    [customerId]
  );

  useEffect(() => {
    if (isFirstVoucherRender.current) {
      isFirstVoucherRender.current = false;
      return;
    }
    fetchVouchers(voucherFilter, voucherPage);
  }, [voucherFilter, voucherPage, fetchVouchers]);

  useEffect(() => {
    if (isFirstActivityRender.current) {
      isFirstActivityRender.current = false;
      return;
    }
    fetchActivities(activityFilter, activityDate, activityPage);
  }, [activityFilter, activityDate, activityPage, fetchActivities]);

  const handleVoucherFilterChange = (filter: "ALL" | "ACTIVE" | "INACTIVE") => {
    setVoucherFilter(filter);
    setVoucherPage(1);
  };

  const handleActivityFilterChange = (type: "ALL" | "TRANSACTION" | "SESSION" | "BOOKING") => {
    setActivityFilter(type);
    setActivityPage(1);
  };

  const handleActivityDateChange = (date: Date | undefined) => {
    setActivityDate(date);
    setActivityPage(1);
  };

  const handleResetActivityFilters = () => {
    setActivityFilter("ALL");
    setActivityDate(undefined);
    setActivityPage(1);
  };

  return {
    vouchers,
    voucherFilter,
    voucherPage,
    voucherTotal,
    voucherTotalPages,
    isLoadingVouchers,
    setVoucherPage,
    handleVoucherFilterChange,
    activities,
    activityFilter,
    activityDate,
    activityPage,
    activityTotal,
    activityTotalPages,
    isLoadingActivities,
    setActivityPage,
    handleActivityFilterChange,
    handleActivityDateChange,
    handleResetActivityFilters,
  };
}
