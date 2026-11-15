import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { io } from "socket.io-client";
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

export interface AvailableTimeSlot {
  time: string;
  availableCount: number;
  canFulfill: boolean;
  hasBusyStaff?: boolean;
  reason?: string;
}

export function useAdminBookingForm({ branchId, onSuccess }: UseAdminBookingFormProps) {
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmBusyStaffOpen, setConfirmBusyStaffOpen] = useState(false);

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections",
  });

  const selectedDate = form.watch("date");
  const selectedStartTime = form.watch("startTime");
  const selections = useWatch({ control: form.control, name: "selections" });
  const selectedServiceId = selections?.[0]?.serviceId;

  const isBusyStaffSelected = useMemo(() => {
    if (!selectedStartTime) return false;
    const slot = availableSlots.find((s) => s.time === selectedStartTime);
    return Boolean(slot?.hasBusyStaff);
  }, [availableSlots, selectedStartTime]);

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
    return selections.map((s) => `${s.serviceId || ""}-${s.staffId || "none"}`).join("|");
  }, [selections]);

  // Fetch available slots when date or service changes
  useEffect(() => {
    if (selectedDate) {
      setLoadingSlots(true);
      getAvailableSlotsAction(branchId, selectedDate, selections || []).then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setAvailableSlots(res.data);
          const currentStart = form.getValues("startTime");
          if (currentStart) {
            const match = res.data.find((s: AvailableTimeSlot) => s.time === currentStart);
            if (!match || !match.canFulfill) {
              form.setValue("startTime", "");
            }
          }
        } else {
          setAvailableSlots([]);
        }
        setLoadingSlots(false);
      });
    } else {
      setAvailableSlots([]);
    }
  }, [branchId, selectedDate, slotDependencies]);

  const submitBooking = async (values: BookingInput) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        selections: (values.selections || []).map(s => ({
          ...s,
          staffId: s.staffId === "none" ? undefined : s.staffId
        }))
      };
      const res = await createBookingAction(payload);
      if (res.success) {
        toast.success("Booking berhasil dibuat");
        try {
          const socket = io(
            process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined
          );
          socket.emit("new_booking", { branchId: values.branchId });
          setTimeout(() => socket.disconnect(), 1000);
        } catch {
          // Ignore socket errors
        }
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

  const onSubmit = async (values: BookingInput) => {
    if (isBusyStaffSelected) {
      setConfirmBusyStaffOpen(true);
      return;
    }
    await submitBooking(values);
  };

  const confirmBusyStaffSubmit = async () => {
    setConfirmBusyStaffOpen(false);
    await submitBooking(form.getValues());
  };

  return {
    form,
    fields,
    append,
    remove,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting,
    loadingInitial,
    loadingSlots,
    services,
    staffList,
    availableSlots,
    selectedDate,
    selectedStartTime,
    selectedServiceId,
    isBusyStaffSelected,
    confirmBusyStaffOpen,
    setConfirmBusyStaffOpen,
    confirmBusyStaffSubmit,
  };
}
