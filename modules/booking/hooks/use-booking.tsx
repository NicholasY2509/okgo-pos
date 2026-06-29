import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { bookingSchema, type BookingInput } from "../schemas/booking";
import { createBookingAction } from "../actions/booking-actions";

export function useBooking() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      branchId: "",
      customerName: "",
      customerPhone: "",
      selections: [{ serviceId: "", staffId: undefined }],
      date: new Date().toISOString().split('T')[0],
      startTime: "",
    },
  });

  useEffect(() => {
    const draft = localStorage.getItem("booking_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        console.log("Found booking draft:", parsed);

        if (parsed && parsed.values && parsed.step && (parsed.values.customerName || parsed.values.customerPhone || parsed.step > 1)) {
          setTimeout(() => {
            toast.custom((t) => (
              <div className="bg-background border border-border/50 shadow-xl rounded-2xl p-5 flex flex-col gap-4 w-[350px] font-sans pointer-events-auto">
                <div>
                  <h3 className="text-base font-medium text-foreground">Draf Booking Ditemukan</h3>
                  <p className="text-sm text-muted-foreground font-light mt-1 leading-relaxed">
                    Anda mempunyai pengisian anda yang belum selesai, Apakah Anda ingin melanjutkannya?
                  </p>
                </div>
                <div className="flex justify-end gap-3 mt-1">
                  <button
                    className="px-4 py-2 text-xs font-medium bg-muted/50 hover:bg-muted text-muted-foreground rounded-full transition-colors cursor-pointer"
                    onClick={() => {
                      localStorage.removeItem("booking_draft");
                      setIsRestored(true);
                      toast.dismiss(t);
                    }}
                  >
                    Mulai Baru
                  </button>
                  <button
                    className="px-4 py-2 text-xs font-medium bg-foreground hover:bg-primary text-background hover:text-primary-foreground rounded-full transition-all cursor-pointer shadow-sm"
                    onClick={() => {
                      form.reset(parsed.values);
                      setStep(parsed.step);
                      setIsRestored(true);
                      toast.dismiss(t);
                    }}
                  >
                    Lanjutkan
                  </button>
                </div>
              </div>
            ), {
              duration: 10000,
              position: "top-center",
              onDismiss: () => setIsRestored(true),
              onAutoClose: () => setIsRestored(true),
            });
          }, 300);
        } else {
          setIsRestored(true);
        }
      } catch (e) {
        setIsRestored(true);
      }
    } else {
      setIsRestored(true);
    }
  }, [form]);

  useEffect(() => {
    if (!isRestored || isSuccess) return;

    localStorage.setItem("booking_draft", JSON.stringify({ step, values: form.getValues() }));

    const subscription = form.watch((value) => {
      localStorage.setItem("booking_draft", JSON.stringify({ step, values: form.getValues() }));
    });

    return () => subscription.unsubscribe();
  }, [form, step, isSuccess, isRestored]);

  const nextStep = async () => {
    // Validate fields before proceeding
    const fieldsToValidate = {
      1: ["branchId", "customerName", "customerPhone"],
      2: ["date", "startTime"],
      3: ["selections"],
    }[step] as any;

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  async function onSubmit(values: BookingInput) {
    setError(null);
    const result = await createBookingAction(values);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      setIsSuccess(true);
      form.reset();
      setStep(1);
      localStorage.removeItem("booking_draft");
      toast.success("Booking berhasil dibuat!");
    }
  }

  return {
    form,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    error,
    step,
    nextStep,
    prevStep,
    isSuccess
  };
}
