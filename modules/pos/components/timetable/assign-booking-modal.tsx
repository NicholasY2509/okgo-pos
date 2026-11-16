"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BadgePercent, CheckCircle2, ChevronRight, DoorOpen, Loader2, Plus, Sparkles, Tag, Ticket, Trash2, User, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { AssignBookingSelectionDialog, type BookingSelectionValue } from "./assign-booking-selection-dialog";
import { assignBookingToTimetableAction, previewBookingAssignmentAction } from "@/modules/booking/actions/booking-actions";
import { updateBookingStatusAction } from "@/modules/booking/actions/booking-list-actions";
import { getEligiblePromotionsAction } from "@/modules/discount/actions/promotion-action";
import { getCustomerVouchersAction, getVoucherByCodeAction } from "@/modules/vouchers/actions/get-customer-vouchers-action";
import { useTimetableStore } from "../../stores/timetable-store";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const assignSchema = z.object({
  date: z.date({ message: "Tanggal harus diisi" }),
  time: z.string().min(1, "Waktu harus diisi"),
  selections: z.array(z.object({
    serviceId: z.string().min(1, "Layanan harus dipilih"),
    staffId: z.string().min(1, "Terapis harus dipilih"),
    roomId: z.string().optional(),
    isVip: z.boolean().optional(),
    discountAmount: z.number().min(0).optional(),
    customerVoucherId: z.string().optional(),
    voucherCode: z.string().optional(),
  })).min(1, "Minimal pilih 1 layanan")
});

type AssignInput = z.infer<typeof assignSchema>;

interface AppliedPromoItem {
  promoId: string;
  name: string;
  discountAmount: number;
  rewardType?: string;
  applicableProductIds?: string[];
  rewardValue?: number;
}

export function AssignBookingModal() {
  const { 
    branchId, 
    rooms,
    products,
    staff,
    selectedBookingForAssignment, 
    setSelectedBookingForAssignment,
    setSelectedTransactionForPayment,
    fetchPendingBookings, 
    fetchSessions 
  } = useTimetableStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<"pay_later" | "pay_now" | "cancel" | null>(null);
  const [editingSelectionIndex, setEditingSelectionIndex] = useState<number | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [appliedPromos, setAppliedPromos] = useState<AppliedPromoItem[]>([]);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);
  const [eligiblePromos, setEligiblePromos] = useState<any[]>([]);
  const [appliedNominalVoucher, setAppliedNominalVoucher] = useState<any | null>(null);
  const [isVoucherDialogOpen, setIsVoucherDialogOpen] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [ownedVouchers, setOwnedVouchers] = useState<any[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isApplyingVoucherCode, setIsApplyingVoucherCode] = useState(false);

  const form = useForm<AssignInput>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      date: undefined,
      time: "",
      selections: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "selections"
  });

  useEffect(() => {
    if (selectedBookingForAssignment) {
      setAppliedPromos([]);
      const preAppliedNominal =
        selectedBookingForAssignment.appliedVoucher &&
        !selectedBookingForAssignment.appliedVoucher.voucherPacket?.productId
          ? selectedBookingForAssignment.appliedVoucher
          : null;
      setAppliedNominalVoucher(preAppliedNominal);
      const scheduledDate = new Date(selectedBookingForAssignment.scheduledStartTime);
      const timeStr = format(scheduledDate, "HH:mm");

      if (selectedBookingForAssignment.items && selectedBookingForAssignment.items.length > 0) {
        const count = selectedBookingForAssignment.guestCount || 1;
        const defaults = selectedBookingForAssignment.items.map((item: any) => ({
          serviceId: item.serviceId,
          staffId: item.requestedStaffId || "",
          roomId: "auto",
          isVip: false,
          discountAmount: item.appliedVoucherId ? Number(item.unitPrice || 0) : 0,
          customerVoucherId: item.appliedVoucherId || undefined,
          voucherCode: item.appliedVoucher?.code || undefined,
        }));
        // pad with empty selections if less than guest count
        while (defaults.length < count) {
          defaults.push({ serviceId: "", staffId: "", roomId: "auto", isVip: false, discountAmount: 0 });
        }
        form.reset({ date: scheduledDate, time: timeStr, selections: defaults });
      } else {
        const count = selectedBookingForAssignment.guestCount || 1;
        const defaults = Array(count).fill({ serviceId: "", staffId: "", roomId: "auto", isVip: false, discountAmount: 0 });
        form.reset({ date: scheduledDate, time: timeStr, selections: defaults });
      }
    }
  }, [selectedBookingForAssignment, form]);

  const watchedSelections = form.watch("selections");

  const hasAnyVoucherApplied = useMemo(() => {
    return Boolean(appliedNominalVoucher) || (watchedSelections || []).some((s) => Boolean(s?.customerVoucherId));
  }, [appliedNominalVoucher, watchedSelections]);

  const pricingSummary = useMemo(() => {
    const productMap = new Map((products || []).map((p: any) => [p.id, p]));
    let serviceSubtotal = 0;
    let vipCount = 0;
    let itemDiscountTotal = 0;

    for (const sel of watchedSelections || []) {
      const prod: any = sel?.serviceId ? productMap.get(sel.serviceId) : null;
      const unitPrice = prod?.price ? Number(prod.price) : 0;
      const discount = sel?.customerVoucherId
        ? unitPrice
        : Math.min(unitPrice, Math.max(0, Number(sel?.discountAmount || 0)));
      serviceSubtotal += unitPrice;
      itemDiscountTotal += discount;
      if (sel?.isVip) vipCount += 1;
    }

    const vipTotal = vipCount * 80000;
    const grossSubtotal = serviceSubtotal + vipTotal;
    const promoDiscountTotal = appliedPromos.reduce((sum, p) => sum + Number(p.discountAmount || 0), 0);
    const remainingBeforeNominal = Math.max(0, grossSubtotal - itemDiscountTotal - promoDiscountTotal);
    const nominalVoucherDiscount = appliedNominalVoucher?.remainingCreditAmount
      ? Math.min(Number(appliedNominalVoucher.remainingCreditAmount), remainingBeforeNominal)
      : 0;
    const grandTotal = Math.max(0, remainingBeforeNominal - nominalVoucherDiscount);

    return {
      serviceSubtotal,
      vipCount,
      vipTotal,
      itemDiscountTotal,
      promoDiscountTotal,
      nominalVoucherDiscount,
      grandTotal,
    };
  }, [watchedSelections, products, appliedPromos, appliedNominalVoucher]);

  const handleOpenPromoDialog = async (open: boolean) => {
    setIsPromoDialogOpen(open);
    if (open && branchId) {
      setIsLoadingPromos(true);
      try {
        const productMap = new Map((products || []).map((p: any) => [p.id, p]));
        const cartLikeItems = (watchedSelections || [])
          .filter((s) => s.serviceId)
          .map((s) => {
            const prod: any = productMap.get(s.serviceId);
            return {
              type: "SERVICE",
              serviceId: s.serviceId,
              name: prod?.name || "Layanan",
              unitPrice: prod?.price ? Number(prod.price) : 0,
              quantity: 1,
              discountAmount: Number(s.discountAmount || 0),
            };
          });
        const result = await getEligiblePromotionsAction(cartLikeItems, branchId);
        if (result.success && result.data) {
          setEligiblePromos(result.data);
        } else {
          toast.error("Gagal memuat promo");
        }
      } catch {
        toast.error("Gagal memuat promo");
      } finally {
        setIsLoadingPromos(false);
      }
    }
  };

  const togglePromo = (promo: any) => {
    if (hasAnyVoucherApplied) {
      toast.error("Voucher dan Diskon Promosi tidak dapat digunakan bersamaan.");
      return;
    }
    setAppliedPromos((prev) => {
      const exists = prev.some((p) => p.promoId === promo.promoId);
      if (exists) {
        return prev.filter((p) => p.promoId !== promo.promoId);
      }
      return [
        ...prev,
        {
          promoId: promo.promoId,
          name: promo.name,
          discountAmount: promo.potentialDiscountValue,
          rewardType: promo.rewardType,
          applicableProductIds: promo.applicableProductIds,
          rewardValue: promo.rewardValue,
        },
      ];
    });
  };

  const handleOpenVoucherDialog = async (open: boolean) => {
    setIsVoucherDialogOpen(open);
    if (!open) {
      setVoucherCodeInput("");
      return;
    }
    const customerId = selectedBookingForAssignment?.customerId;
    if (!customerId) {
      setOwnedVouchers([]);
      return;
    }
    setIsLoadingVouchers(true);
    try {
      const result = await getCustomerVouchersAction(customerId);
      if (result.success && result.data) {
        setOwnedVouchers(result.data);
      } else {
        toast.error("Gagal mengambil data voucher pelanggan.");
      }
    } catch {
      toast.error("Gagal mengambil data voucher pelanggan.");
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleUseVoucher = (voucher: any) => {
    const customerId = selectedBookingForAssignment?.customerId;
    if (voucher.customerId && customerId && voucher.customerId !== customerId) {
      toast.error("Voucher ini bukan milik pelanggan ini.");
      return;
    }

    const isServiceVoucher = Boolean(voucher.voucherPacket?.productId);
    const currentSelections = form.getValues("selections") || [];

    if (isServiceVoucher) {
      const timesApplied = currentSelections.filter((s) => s.customerVoucherId === voucher.id).length;
      if (voucher.remainingVisitCount == null || voucher.remainingVisitCount <= timesApplied) {
        toast.error("Kuota kunjungan voucher ini sudah habis.");
        return;
      }

      const matchIndex = currentSelections.findIndex(
        (s) => s.serviceId === voucher.voucherPacket.productId && !s.customerVoucherId
      );
      if (matchIndex === -1) {
        toast.error("Layanan untuk voucher ini belum dipilih atau sudah menggunakan voucher.");
        return;
      }

      const prod: any = (products || []).find((p: any) => p.id === voucher.voucherPacket.productId);
      const unitPrice = prod?.price ? Number(prod.price) : 0;

      form.setValue(`selections.${matchIndex}.customerVoucherId`, voucher.id);
      form.setValue(`selections.${matchIndex}.voucherCode`, voucher.code);
      form.setValue(`selections.${matchIndex}.discountAmount`, unitPrice);
      setAppliedPromos([]);
      toast.success("Voucher layanan berhasil diterapkan.");
      setIsVoucherDialogOpen(false);
    } else {
      if (voucher.remainingCreditAmount != null && Number(voucher.remainingCreditAmount) > 0) {
        setAppliedNominalVoucher(voucher);
        setAppliedPromos([]);
        toast.success("Voucher nominal berhasil diterapkan.");
        setIsVoucherDialogOpen(false);
      } else {
        toast.error("Saldo voucher nominal ini sudah habis.");
      }
    }
  };

  const handleApplyVoucherByCode = async () => {
    if (!voucherCodeInput.trim()) {
      toast.error("Masukkan kode voucher terlebih dahulu");
      return;
    }
    setIsApplyingVoucherCode(true);
    try {
      const result = await getVoucherByCodeAction(voucherCodeInput.trim());
      if (result.success && result.data) {
        handleUseVoucher(result.data);
      } else {
        toast.error(result.error || "Gagal memuat voucher");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memeriksa voucher.");
    } finally {
      setIsApplyingVoucherCode(false);
    }
  };

  const handleRemoveServiceVoucher = (index: number) => {
    form.setValue(`selections.${index}.customerVoucherId`, undefined);
    form.setValue(`selections.${index}.voucherCode`, undefined);
    form.setValue(`selections.${index}.discountAmount`, 0);
  };

  const handleAssign = async (values: AssignInput, openPaymentAfter: boolean) => {
    if (!selectedBookingForAssignment) return;
    setIsSubmitting(true);
    setSubmitAction(openPaymentAfter ? "pay_now" : "pay_later");
    
    try {
      const dateStr = format(values.date, "yyyy-MM-dd");
      const startTime = new Date(`${dateStr}T${values.time}:00`);
      const normalizedSelections = values.selections.map((s) => ({
        serviceId: s.serviceId,
        staffId: s.staffId,
        roomId: s.roomId && s.roomId !== "auto" ? s.roomId : undefined,
        isVip: Boolean(s.isVip),
        discountAmount: Number(s.discountAmount || 0),
        customerVoucherId: s.customerVoucherId || undefined,
      }));
      const promotionIds = appliedPromos.map((p) => p.promoId);
      const nominalVoucherId = appliedNominalVoucher?.id;

      if (openPaymentAfter) {
        const previewRes = await previewBookingAssignmentAction(
          selectedBookingForAssignment.id,
          startTime,
          normalizedSelections,
          promotionIds,
          nominalVoucherId
        );
        if (previewRes.success && previewRes.data) {
          setSelectedBookingForAssignment(null);
          setSelectedTransactionForPayment(previewRes.data);
        } else {
          toast.error(previewRes.error || "Gagal memeriksa ketersediaan jadwal");
        }
        return;
      }

      const res = await assignBookingToTimetableAction(
        selectedBookingForAssignment.id,
        startTime,
        normalizedSelections,
        promotionIds,
        nominalVoucherId
      );
      if (res.success) {
        toast.success("Booking berhasil ditugaskan ke jadwal");
        const socket = io(
          process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined
        );
        socket.emit("service_assigned", { branchId });
        setTimeout(() => socket.disconnect(), 1000);
        fetchPendingBookings();
        fetchSessions();
        setSelectedBookingForAssignment(null);
      } else {
        toast.error(res.error || "Gagal menugaskan booking");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingForAssignment) return;
    setIsSubmitting(true);
    setSubmitAction("cancel");
    try {
      const res = await updateBookingStatusAction(selectedBookingForAssignment.id, "CANCELLED");
      if (res.success) {
        toast.success("Booking berhasil dibatalkan");
        const socket = io(
          process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined
        );
        socket.emit("service_assigned", { branchId });
        setTimeout(() => socket.disconnect(), 1000);
        fetchPendingBookings();
        fetchSessions();
        setIsCancelDialogOpen(false);
        setSelectedBookingForAssignment(null);
      } else {
        toast.error(res.error || "Gagal membatalkan booking");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat membatalkan booking");
    } finally {
      setIsSubmitting(false);
      setSubmitAction(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setEditingSelectionIndex(null);
      setSelectedBookingForAssignment(null);
    }
  };

  const selectedDateVal = form.watch("date");
  const selectedTimeVal = form.watch("time");
  const selectedStartTime = useMemo(() => {
    if (!selectedDateVal || !selectedTimeVal) return undefined;
    const dateStr = format(selectedDateVal, "yyyy-MM-dd");
    return new Date(`${dateStr}T${selectedTimeVal}:00`);
  }, [selectedDateVal, selectedTimeVal]);

  const handleSaveSelection = (index: number, value: BookingSelectionValue) => {
    form.setValue(`selections.${index}.serviceId`, value.serviceId, { shouldValidate: true });
    form.setValue(`selections.${index}.staffId`, value.staffId, { shouldValidate: true });
    form.setValue(`selections.${index}.roomId`, value.roomId || "auto");
    form.setValue(`selections.${index}.isVip`, Boolean(value.isVip));
    form.setValue(`selections.${index}.discountAmount`, Number(value.discountAmount || 0));
    form.setValue(`selections.${index}.customerVoucherId`, value.customerVoucherId);
    form.setValue(`selections.${index}.voucherCode`, value.voucherCode);
  };

  const isOpen = !!selectedBookingForAssignment;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[980px] max-h-[90vh] overflow-y-auto lg:overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tugaskan Booking ke Jadwal</DialogTitle>
          {selectedBookingForAssignment && (
            <DialogDescription>
              {selectedBookingForAssignment.customerName || "Pelanggan"} -{" "}
              {format(new Date(selectedBookingForAssignment.scheduledStartTime), "EEEE, d MMM yyyy HH:mm", { locale: id })} WIB
            </DialogDescription>
          )}
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => handleAssign(values, true))}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0"
          >
            {/* Left Side: Schedule & Visitor Selections */}
            <div className="lg:col-span-7 space-y-5 lg:max-h-[calc(90vh-8.5rem)] lg:overflow-y-auto lg:pr-2">
              <div className="grid grid-cols-2 gap-4 border-b border-border/50 pb-5">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal</FormLabel>
                    <FormControl>
                      <DatePicker date={field.value} setDate={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waktu</FormLabel>
                    <FormControl>
                      <TimePicker value={field.value} onChange={field.onChange} variant="minutes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Layanan yang Dipilih ({fields.length} orang)</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ serviceId: "", staffId: "", roomId: "auto", isVip: false, discountAmount: 0 })}
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Orang
                </Button>
              </div>

              {fields.map((field, index) => {
                const selection = watchedSelections?.[index];
                const selectedProduct = (products || []).find((p: any) => p.id === selection?.serviceId);
                const selectedStaff = (staff || []).find((s: any) => s.id === selection?.staffId);
                const selectedRoom =
                  selection?.roomId && selection.roomId !== "auto"
                    ? (rooms || []).find((r: any) => r.id === selection.roomId)
                    : null;
                const selectionError = form.formState.errors.selections?.[index];
                const hasError = Boolean(selectionError?.serviceId || selectionError?.staffId);

                return (
                  <div
                    key={field.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingSelectionIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setEditingSelectionIndex(index);
                      }
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all cursor-pointer bg-card hover:bg-accent/40 space-y-3",
                      hasError
                        ? "border-destructive ring-1 ring-destructive/30"
                        : "border-border/70 hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Pengunjung {index + 1}
                        </span>
                        {selection?.isVip && (
                          <Badge variant="outline" className="border-amber-500/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px]">
                            VIP (+Rp 80.000)
                          </Badge>
                        )}
                        {selection?.customerVoucherId && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Ticket className="w-3 h-3" />
                            {selection.voucherCode || "Voucher"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(index);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
                      <div className="flex items-start gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">Layanan</p>
                          {selectedProduct ? (
                            <p className="font-medium text-foreground truncate">
                              {selectedProduct.name}
                            </p>
                          ) : (
                            <p className={cn("text-xs italic", selectionError?.serviceId ? "text-destructive" : "text-muted-foreground")}>
                              Pilih layanan
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 min-w-0">
                        <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">Terapis</p>
                          {selectedStaff ? (
                            <p className="font-medium text-foreground truncate">
                              {selectedStaff.firstName} {selectedStaff.lastName}
                            </p>
                          ) : (
                            <p className={cn("text-xs italic", selectionError?.staffId ? "text-destructive" : "text-muted-foreground")}>
                              Pilih terapis
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 min-w-0">
                        <DoorOpen className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">Ruangan</p>
                          <p className="font-medium text-foreground truncate">
                            {selectedRoom
                              ? `${selectedRoom.name}${selectedRoom.isVip ? " (VIP)" : ""}`
                              : "Otomatis"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {!selection?.customerVoucherId && Number(selection?.discountAmount || 0) > 0 && (
                      <div className="text-xs text-emerald-600 font-medium pt-1 border-t border-border/40">
                        Diskon Item: - Rp {Number(selection.discountAmount).toLocaleString("id-ID")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            {/* Right Side: Promo, Voucher, Price Breakdown & Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5 lg:border-l lg:border-border/50 lg:pl-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Rincian Nominal Harga</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={hasAnyVoucherApplied}
                      onClick={() => handleOpenPromoDialog(true)}
                      className="h-8 flex-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                    >
                      <BadgePercent className="w-4 h-4 mr-1.5" />
                      {appliedPromos.length > 0 ? `${appliedPromos.length} Promo` : "Gunakan Promo"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenVoucherDialog(true)}
                      className="h-8 flex-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                    >
                      <Ticket className="w-4 h-4 mr-1.5" />
                      {hasAnyVoucherApplied ? "Voucher Aktif" : "Gunakan Voucher"}
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border/60 space-y-2.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal Layanan ({fields.length} Sesi)</span>
                    <span>Rp {pricingSummary.serviceSubtotal.toLocaleString("id-ID")}</span>
                  </div>
                  {pricingSummary.vipCount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Upgrade VIP ({pricingSummary.vipCount} Sesi)</span>
                      <span>+ Rp {pricingSummary.vipTotal.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {pricingSummary.itemDiscountTotal > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Diskon Item / Voucher</span>
                      <span>- Rp {pricingSummary.itemDiscountTotal.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  {appliedPromos.map((promo) => (
                    <div key={promo.promoId} className="flex justify-between items-center text-primary">
                      <span className="truncate pr-2">Promo: {promo.name}</span>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>- Rp {Number(promo.discountAmount || 0).toLocaleString("id-ID")}</span>
                        <button
                          type="button"
                          onClick={() => setAppliedPromos((prev) => prev.filter((p) => p.promoId !== promo.promoId))}
                          className="text-muted-foreground hover:text-destructive"
                          title="Hapus promo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {appliedNominalVoucher && pricingSummary.nominalVoucherDiscount > 0 && (
                    <div className="flex justify-between items-center text-primary">
                      <span className="truncate pr-2">Voucher ({appliedNominalVoucher.code})</span>
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span>- Rp {pricingSummary.nominalVoucherDiscount.toLocaleString("id-ID")}</span>
                        <button
                          type="button"
                          onClick={() => setAppliedNominalVoucher(null)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Hapus voucher"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-border/60 font-bold text-base">
                    <span>Total Tagihan</span>
                    <span>Rp {pricingSummary.grandTotal.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  className="w-full"
                  disabled={isSubmitting || fields.length === 0}
                  onClick={form.handleSubmit((values) => handleAssign(values, true))}
                >
                  {isSubmitting && submitAction === "pay_now" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Bayar Sekarang & Jadwalkan Sesi"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={isSubmitting || fields.length === 0}
                  onClick={form.handleSubmit((values) => handleAssign(values, false))}
                >
                  {isSubmitting && submitAction === "pay_later" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    "Bayar Nanti & Jadwalkan Sesi"
                  )}
                </Button>
                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    disabled={isSubmitting}
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    Batalkan Booking
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitting}
                    onClick={() => setSelectedBookingForAssignment(null)}
                  >
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>

      <Dialog open={isPromoDialogOpen} onOpenChange={handleOpenPromoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Promo & Diskon Tersedia
            </DialogTitle>
            <DialogDescription>
              Pilih promosi aktif yang sesuai dengan layanan yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {isLoadingPromos ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Memeriksa promo yang tersedia...</div>
            ) : eligiblePromos.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm border rounded-lg border-dashed">
                Tidak ada promo yang sedang aktif saat ini.
              </div>
            ) : (
              eligiblePromos.map((promo) => {
                const isSelected = appliedPromos.some((p) => p.promoId === promo.promoId);
                const isEligible = promo.isEligible;

                return (
                  <div
                    key={promo.promoId}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      !isEligible
                        ? "opacity-50 bg-muted/40 cursor-not-allowed"
                        : isSelected
                          ? "border-primary bg-primary/5 cursor-pointer shadow-sm"
                          : "hover:border-primary/40 cursor-pointer bg-card"
                    }`}
                    onClick={() => isEligible && togglePromo(promo)}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{promo.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{promo.description}</p>
                      {!isEligible && promo.reason && (
                        <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 mt-1">
                          {promo.reason}
                        </Badge>
                      )}
                      {isEligible && promo.potentialDiscountValue > 0 && (
                        <div className="pt-1">
                          <span className="text-sm font-bold text-primary">
                            -Rp {promo.potentialDiscountValue.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button type="button" onClick={() => setIsPromoDialogOpen(false)}>
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVoucherDialogOpen} onOpenChange={handleOpenVoucherDialog}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Gunakan Voucher
            </DialogTitle>
            <DialogDescription>
              Pilih voucher milik pelanggan atau masukkan kode voucher secara manual.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <div className="text-sm font-semibold">Redeem Manual</div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Kode Voucher (Contoh: VCH-1234)"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyVoucherByCode();
                    }
                  }}
                />
                <Button type="button" onClick={handleApplyVoucherByCode} disabled={isApplyingVoucherCode || !voucherCodeInput.trim()}>
                  {isApplyingVoucherCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pakai"}
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="text-sm font-semibold">
                Voucher Dimiliki ({ownedVouchers.length})
              </div>
              {!selectedBookingForAssignment?.customerId ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                  Booking ini tidak terhubung ke data pelanggan terdaftar.
                </div>
              ) : isLoadingVouchers ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : ownedVouchers.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center border border-dashed">
                  Pelanggan ini tidak memiliki voucher aktif.
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {ownedVouchers.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div>
                        <p className="font-semibold text-sm">{v.voucherPacket?.name || "Paket Voucher"}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{v.code}</p>
                        <p className="text-xs font-medium text-primary mt-1">
                          {v.voucherPacket?.productId
                            ? `Sisa ${v.remainingVisitCount ?? 0}x Kunjungan`
                            : `Sisa Rp ${Number(v.remainingCreditAmount ?? 0).toLocaleString("id-ID")}`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleUseVoucher(v)}
                      >
                        Pakai
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Batalkan Booking?</DialogTitle>
            <DialogDescription>
              Booking untuk{" "}
              <span className="font-semibold text-foreground">
                {selectedBookingForAssignment?.customerName || "Pelanggan"}
              </span>{" "}
              akan diubah statusnya menjadi dibatalkan dan dihapus dari daftar tunggu jadwal.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsCancelDialogOpen(false)}
            >
              Kembali
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isSubmitting}
              onClick={handleCancelBooking}
            >
              {isSubmitting && submitAction === "cancel" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Membatalkan...
                </>
              ) : (
                "Ya, Batalkan Booking"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {editingSelectionIndex !== null && watchedSelections?.[editingSelectionIndex] && (
        <AssignBookingSelectionDialog
          key={`assign-selection-${editingSelectionIndex}`}
          open={editingSelectionIndex !== null}
          visitorIndex={editingSelectionIndex}
          branchId={branchId || ""}
          startTime={selectedStartTime}
          products={products || []}
          staff={staff || []}
          rooms={rooms || []}
          initialValue={watchedSelections[editingSelectionIndex]}
          onClose={() => setEditingSelectionIndex(null)}
          onSave={(val) => handleSaveSelection(editingSelectionIndex, val)}
          onRemoveVoucher={() => handleRemoveServiceVoucher(editingSelectionIndex)}
        />
      )}
    </Dialog>
  );
}
