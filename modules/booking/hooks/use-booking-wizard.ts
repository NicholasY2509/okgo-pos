import { useEffect, useState } from "react";
import { getBranchesAction, getServicesAction, getStaffStatusAction, getDailyScheduleAction } from "../actions/booking-actions";
import { useBooking } from "./use-booking";

export function useBookingWizard() {
  const booking = useBooking();
  const { form, step } = booking;
  
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dailySchedule, setDailySchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const selectedBranchId = form.watch("branchId");
  const selections = form.watch("selections");
  const selectedDate = form.watch("date");
  const selectedTime = form.watch("startTime");
  const customerName = (form.watch as any)("customerName");
  const customerPhone = (form.watch as any)("customerPhone");

  let canProceed = false;
  if (step === 1) {
    canProceed = !!(customerName && customerPhone && selectedBranchId);
  } else if (step === 2) {
    canProceed = !!(selectedDate && selectedTime);
  } else if (step === 3) {
    canProceed = selections && selections.length > 0 && selections.every((s: any) => !!s.serviceId);
  } else if (step === 4) {
    canProceed = true;
  }

  useEffect(() => {
    getBranchesAction().then((res) => {
      if (res.success && res.data) setBranches(res.data);
      setLoadingBranches(false);
    });
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      setLoading(true);
      Promise.all([
        getServicesAction(selectedBranchId),
        getStaffStatusAction(selectedBranchId)
      ]).then(([servicesRes, staffRes]) => {
        if (servicesRes.success && servicesRes.data) setServices(servicesRes.data);
        if (staffRes.success && staffRes.data) setStaffList(staffRes.data);
        setLoading(false);
      });
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (selectedBranchId && selectedDate) {
      setLoading(true);
      getDailyScheduleAction(selectedBranchId, selectedDate)
        .then(res => {
          if (res.success && res.data) {
            setDailySchedule(res.data);
          }
          setLoading(false);
        });
    }
  }, [selectedBranchId, selectedDate]);

  return {
    ...booking,
    branches,
    services,
    staffList,
    availableSlots,
    dailySchedule,
    loading,
    loadingBranches,
    canProceed
  };
}
