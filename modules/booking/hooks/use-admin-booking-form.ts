import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { bookingSchema, type BookingInput } from "../schemas/booking";
import {
  getServicesAction,
  getStaffStatusAction,
  getAvailableSlotsAction,
  createBookingAction
} from "../actions/booking-actions";

interface UseAdminBookingFormProps {
  branchId: string;
  onSuccess?: () => void;
}

export function useAdminBookingForm({ branchId, onSuccess }: UseAdminBookingFormProps) {
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branchId,
      customerId: "",
      selections: [{ serviceId: "", staffId: undefined }],
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "",
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

  // Use a stringified version of the selections specifically for the dependency array
  // to avoid unnecessary rerenders while avoiding the JSON.stringify whole object trap
  const slotDependencies = useMemo(() => {
    if (!selections || selections.length === 0) return "";
    return `${selections[0].serviceId}-${selections[0].staffId || 'none'}`;
  }, [selectedServiceId, selectedStaffId]);

  // Fetch available slots when date or service changes
  useEffect(() => {
    if (selectedServiceId && selectedDate) {
      setLoadingSlots(true);
      getAvailableSlotsAction(branchId, selectedDate, selections || []).then((res) => {
        if (res.success) {
          setAvailableSlots(res.data);
        } else {
          setAvailableSlots([]);
        }
        setLoadingSlots(false);
      });
    } else {
      setAvailableSlots([]);
    }
  }, [branchId, selectedDate, slotDependencies]);

  const onSubmit = async (values: BookingInput) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        selections: values.selections.map(s => ({
          ...s,
          staffId: s.staffId === "none" ? undefined : s.staffId
        }))
      };
      const res = await createBookingAction(payload);
      if (res.success) {
        toast.success("Booking berhasil dibuat");
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Gagal membuat booking");
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
    loadingSlots,
    services,
    staffList,
    availableSlots,
    selectedDate,
    selectedServiceId
  };
}
