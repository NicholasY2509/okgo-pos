import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { bookingSchema, type BookingInput } from "../schemas/booking";
import {
  getServicesAction,
  getStaffStatusAction,
  
  updateBookingAction
} from "../actions/booking-actions";

interface UseEditBookingFormProps {
  branchId: string;
  booking: any;
  onSuccess?: () => void;
}

export function useEditBookingForm({ branchId, booking, onSuccess }: UseEditBookingFormProps) {
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialSelections = booking?.items?.map((item: any) => {
    const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
    return {
      serviceId: item.serviceId,
      staffId: session?.staffId || undefined,
      appliedVoucherId: item.appliedVoucherId || undefined,
      appliedVoucherCode: item.appliedVoucher?.code || undefined,
    };
  }) || [{ serviceId: "", staffId: undefined }];

  const initialDate = booking?.scheduledStartTime ? format(new Date(booking.scheduledStartTime), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  const initialTime = booking?.scheduledStartTime ? new Date(booking.scheduledStartTime).toISOString() : "";

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branchId,
      customerId: booking?.customerId || "",
      selections: initialSelections,
      date: initialDate,
      startTime: initialTime,
    },
  });

  const selectedDate = form.watch("date");
  const selections = useWatch({ control: form.control, name: "selections" });
  const selectedServiceId = selections?.[0]?.serviceId;
  const selectedStaffId = selections?.[0]?.staffId;

  // Fetch initial data
  useEffect(() => {
    Promise.all([
      getServicesAction(branchId),
      getStaffStatusAction(branchId)
    ]).then(([servicesRes, staffRes]) => {
      if (servicesRes.success) setServices(servicesRes.data);
      if (staffRes.success) setStaffList(staffRes.data);
      setLoadingInitial(false);
    });
  }, [branchId]);

  const slotDependencies = useMemo(() => {
    if (!selections || selections.length === 0) return "";
    return selections.map(s => `${s.serviceId}-${s.staffId || 'none'}`).join('|');
  }, [selections]);



  const onSubmit = async (values: BookingInput) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        selections: (values.selections || []).map(s => ({
          ...s,
          staffId: s.staffId === "none" ? undefined : s.staffId
        }))
      };
      const res = await updateBookingAction(booking.id, payload);
      if (res.success) {
        toast.success("Booking berhasil diubah");
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Gagal mengubah booking");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    loadingInitial,
    
    services,
    staffList,
    
    selectedDate,
    selectedServiceId
  };
}
