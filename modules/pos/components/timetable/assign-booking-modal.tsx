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
import { BadgePercent, CheckCircle2, Loader2, Plus, Tag, Ticket, Trash2, X } from "lucide-react";
import { ProductCombobox } from "@/modules/product/components/product-combobox";
import { StaffCombobox } from "@/modules/staff/components/staff-combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignBookingToTimetableAction, previewBookingAssignmentAction } from "@/modules/booking/actions/booking-actions";
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
    selectedBookingForAssignment, 
    setSelectedBookingForAssignment,
    setSelectedTransactionForPayment,
    fetchPendingBookings, 
    fetchSessions 
  } = useTimetableStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAction, setSubmitAction] = useState<"pay_later" | "pay_now" | null>(null);
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

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedBookingForAssignment(null);
    }
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

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 rounded-xl border border-border/50 bg-muted/10 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pengunjung {index + 1}</span>
                    {fields.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`selections.${index}.serviceId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Layanan</FormLabel>
                          <FormControl>
                            <ProductCombobox
                              branchId={branchId!}
                              value={field.value || ""}
                              onChange={field.onChange}
                              error={!!form.formState.errors.selections?.[index]?.serviceId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`selections.${index}.staffId`}
                      render={({ field }) => {
                        const selectedServiceId = form.watch(`selections.${index}.serviceId`);
                        const dateVal = form.watch("date");
                        const timeVal = form.watch("time");
                        
                        let selectedStartTime: Date | undefined;
                        if (dateVal && timeVal) {
                          const dateStr = format(dateVal, "yyyy-MM-dd");
                          selectedStartTime = new Date(`${dateStr}T${timeVal}:00`);
                        }

                        return (
                        <FormItem>
                          <FormLabel>Terapis</FormLabel>
                          <FormControl>
                            <StaffCombobox
                              branchId={branchId!}
                              serviceId={selectedServiceId}
                              startTime={selectedStartTime}
                              value={field.value || ""}
                              onChange={(val) => field.onChange(val || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}}
                    />

                    <FormField
                      control={form.control}
                      name={`selections.${index}.roomId`}
                      render={({ field }) => {
                        const isVipSelected = Boolean(form.watch(`selections.${index}.isVip`));
                        const filteredRooms = (rooms || []).filter((room: any) =>
                          isVipSelected ? Boolean(room.isVip) : !room.isVip
                        );
                        return (
                          <FormItem>
                            <FormLabel>Ruangan {isVipSelected ? "(VIP)" : ""}</FormLabel>
                            <Select
                              value={field.value || "auto"}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Otomatis" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="auto">Otomatis</SelectItem>
                                {filteredRooms.map((room: any) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.name} {room.isVip ? "(VIP)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`assign-vip-${index}`}
                        checked={Boolean(form.watch(`selections.${index}.isVip`))}
                        onCheckedChange={(checked) => {
                          const nextVip = checked === true;
                          form.setValue(`selections.${index}.isVip`, nextVip);
                          const currentRoomId = form.getValues(`selections.${index}.roomId`);
                          if (currentRoomId && currentRoomId !== "auto") {
                            const currentRoom = (rooms || []).find((r: any) => r.id === currentRoomId);
                            if (currentRoom && Boolean(currentRoom.isVip) !== nextVip) {
                              form.setValue(`selections.${index}.roomId`, "auto");
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor={`assign-vip-${index}`}
                        className="text-sm font-medium leading-none cursor-pointer text-amber-600"
                      >
                        Upgrade ke VIP (+ Rp 80.000)
                      </label>
                    </div>

                    {form.watch(`selections.${index}.customerVoucherId`) ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Voucher: {form.watch(`selections.${index}.voucherCode`) || "Layanan"}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceVoucher(index)}
                          className="ml-1 hover:text-destructive"
                          title="Hapus voucher"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name={`selections.${index}.discountAmount`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormLabel className="text-xs text-muted-foreground whitespace-nowrap">
                              Diskon Item (Rp)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                className="h-8 w-32 text-right text-sm"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value));
                                  field.onChange(val);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              ))}
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
                    "Bayar Sekarang"
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
                    "Bayar nanti dan jadwalkan sesi"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => setSelectedBookingForAssignment(null)}
                >
                  Batal
                </Button>
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
    </Dialog>
  );
}
