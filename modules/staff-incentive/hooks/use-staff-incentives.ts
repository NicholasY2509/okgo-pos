import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import { getIncentiveSummaryAction } from "../actions/staff-incentive-action";
import { startOfMonth, endOfMonth } from "date-fns";

export function useStaffIncentives(initialRules: any[] = []) {
  const [summary, setSummary] = useState({ totalGross: 0, totalIncentive: 0, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [incentiveRuleId, setIncentiveRuleId] = useState<string>("ALL");

  const fetchSummary = async (ruleType?: string) => {
    setLoading(true);
    const filters: any = {};

    if (searchTerm) filters.search = searchTerm;
    if (ruleType && ruleType !== "ALL") filters.type = ruleType;
    if (dateRange?.from) filters.startDate = dateRange.from;
    if (dateRange?.to) {
      const end = new Date(dateRange.to);
      end.setHours(23, 59, 59, 999);
      filters.endDate = end;
    }

    const result = await getIncentiveSummaryAction(filters);
    if (result.success && result.data) {
      setSummary(result.data);
    } else {
      toast.error(result.error || "Gagal memuat insentif");
    }
    setLoading(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      let mappedType = "ALL";
      if (incentiveRuleId !== "ALL") {
        const selectedRule = initialRules.find(r => r.id === incentiveRuleId);
        if (selectedRule) {
          if (selectedRule.ruleType === "SERVICE_PRICE_PERCENTAGE") mappedType = "SERVICE_COMMISSION";
          else if (selectedRule.ruleType === "VOUCHER_SALES_TIERED") mappedType = "CASHIER_COMMISSION";
          else mappedType = "MANUAL_BONUS";
        }
      }
      fetchSummary(mappedType);
    }, 400); // 400ms debounce
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, dateRange, incentiveRuleId, initialRules]);

  const handleResetFilter = () => {
    setSearchTerm("");
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
    setIncentiveRuleId("ALL");
  };

  return {
    summary,
    loading,
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateRange,
    incentiveRuleId,
    setIncentiveRuleId,
    fetchSummary,
    handleResetFilter,
  };
}
