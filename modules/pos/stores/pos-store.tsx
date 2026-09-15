"use client";

import { createContext, useRef, useContext, ReactNode } from "react";
import { createStore, useStore } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  cartId: string;
  name: string;
  unitPrice: number;
  type: "SERVICE" | "VOUCHER_PACKET";
  serviceId?: string;
  voucherPacketId?: string;
  quantity: number;
  staffId?: string;
  roomId?: string;
  discountAmount: number;
  staffName?: string;
  roomName?: string;
  isVoucherRedemption?: boolean;
  customerVoucherId?: string;
  voucherCode?: string;
};

export type AppliedPromo = {
  promoId: string;
  name: string;
  discountAmount: number;
  rewardType: string;
  applicableProductIds?: string[];
  rewardValue?: number;
};

interface PosState {
  items: CartItem[];
  customerId: string | undefined;
  appliedPromos: AppliedPromo[];
  appliedVoucher: any | null;
  loadedBookingId: string | null;
  loadedTransactionId: string | null;
  isPaymentModalOpen: boolean;
  selectedProduct: any | null;
  selectedVoucherRedemption: any | null;
  isVipUpgrade: boolean;
}

interface PosActions {
  setCustomerId: (id: string | undefined) => void;
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateItemDiscount: (cartId: string, discountAmount: number) => void;
  updateItem: (cartId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  togglePromo: (promo: AppliedPromo) => void;
  clearPromos: () => void;
  applyVoucher: (voucher: any) => void;
  removeVoucher: () => void;
  setLoadedBookingId: (id: string | null) => void;
  setLoadedTransactionId: (id: string | null) => void;
  loadBookingIntoCart: (booking: any) => void;
  setIsPaymentModalOpen: (isOpen: boolean) => void;
  setSelectedProduct: (product: any | null) => void;
  setSelectedVoucherRedemption: (voucher: any | null) => void;
  setIsVipUpgrade: (isVip: boolean) => void;
}

export type PosStore = PosState & PosActions;

export const createPosStore = () => {
  return createStore<PosStore>()(
    persist(
      (set) => ({
        items: [],
        customerId: undefined,
        appliedPromos: [],
        appliedVoucher: null,
        loadedBookingId: null,
        loadedTransactionId: null,
        isPaymentModalOpen: false,
        selectedProduct: null,
        selectedVoucherRedemption: null,
        isVipUpgrade: false,
        setCustomerId: (customerId) => set({ customerId }),
        addItem: (item) =>
          set((state) => ({
            items: [
              ...state.items,
              {
                ...item,
                cartId: Math.random().toString(36).substr(2, 9),
              },
            ],
            // Auto remove promo when items are added as it might invalidate conditions
            appliedPromos: [],
          })),
        removeItem: (cartId) =>
          set((state) => ({
            items: state.items.filter((i) => i.cartId !== cartId),
            // Auto remove promo when items are removed
            appliedPromos: [],
          })),
        updateQuantity: (cartId, quantity) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, quantity } : i)),
            // Auto remove promo when quantity changes
            appliedPromos: [],
          })),
        updateItemDiscount: (cartId, discountAmount) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, discountAmount } : i)),
            appliedPromos: [],
          })),
        updateItem: (cartId, updates) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, ...updates } : i)),
            appliedPromos: [],
          })),
        clearCart: () => set({ items: [], customerId: undefined, appliedPromos: [], appliedVoucher: null, loadedBookingId: null, loadedTransactionId: null }),
        togglePromo: (promo) => set((state) => {
          const exists = state.appliedPromos.some(p => p.promoId === promo.promoId);
          if (exists) {
            return { appliedPromos: state.appliedPromos.filter(p => p.promoId !== promo.promoId) };
          } else {
            return { appliedPromos: [...state.appliedPromos, promo], appliedVoucher: null };
          }
        }), // Applying promo removes voucher
        clearPromos: () => set({ appliedPromos: [] }),
        applyVoucher: (voucher) => set({ appliedVoucher: voucher, appliedPromos: [] }), // Applying voucher removes promo
        removeVoucher: () => set({ appliedVoucher: null }),
        setLoadedBookingId: (loadedBookingId) => set({ loadedBookingId }),
        setLoadedTransactionId: (loadedTransactionId) => set({ loadedTransactionId }),
        setIsPaymentModalOpen: (isOpen) => set({ isPaymentModalOpen: isOpen }),
        setSelectedProduct: (product) => set({ selectedProduct: product }),
        setSelectedVoucherRedemption: (voucher) => set({ selectedVoucherRedemption: voucher }),
        setIsVipUpgrade: (isVipUpgrade) => set({ isVipUpgrade }),
        loadBookingIntoCart: (booking) => {
          const items: CartItem[] = [];

          let remainingVoucherCredit = 0;
          let voucherProductId: string | null = null;
          let hasVoucher = false;

          if (booking.appliedVoucher) {
            hasVoucher = true;
            if (booking.appliedVoucher.voucherPacket?.product) {
              voucherProductId = booking.appliedVoucher.voucherPacket.product.id;
            } else if (booking.appliedVoucher.remainingCreditAmount) {
              remainingVoucherCredit = Number(booking.appliedVoucher.remainingCreditAmount);
            }
          }

          if (booking.items && Array.isArray(booking.items)) {
            let voucherProductRedeemed = false;

            booking.items.forEach((item: any) => {
              let discountAmount = 0;
              let isVoucherRedemption = false;

              if (hasVoucher) {
                if (voucherProductId && item.serviceId === voucherProductId && !voucherProductRedeemed) {
                  discountAmount = Number(item.unitPrice);
                  isVoucherRedemption = true;
                  voucherProductRedeemed = true;
                } else if (remainingVoucherCredit > 0) {
                  const itemTotal = Number(item.unitPrice) * (item.quantity || 1);
                  const discount = Math.min(itemTotal, remainingVoucherCredit);
                  discountAmount = discount / (item.quantity || 1);
                  remainingVoucherCredit -= discount;
                  isVoucherRedemption = true;
                }
              }

              items.push({
                cartId: Math.random().toString(36).substr(2, 9),
                name: item.itemNameSnapshot || "Layanan",
                unitPrice: Number(item.unitPrice),
                type: "SERVICE",
                serviceId: item.serviceId,
                quantity: item.quantity || 1,
                discountAmount,
                isVoucherRedemption: isVoucherRedemption ? true : undefined,
                customerVoucherId: isVoucherRedemption ? booking.appliedVoucher.id : undefined,
                voucherCode: isVoucherRedemption ? booking.appliedVoucher.code : undefined,
              });
            });
          }

          set({
            items,
            customerId: booking.customerId || undefined,
            loadedBookingId: booking.id,
            loadedTransactionId: booking.transactions?.[0]?.id || null, // Assuming first transaction if any
            appliedPromos: [],
            isVipUpgrade: false,
          });
        },
      }),
      {
        name: "pos-cart-storage", // key in localStorage
      }
    )
  );
};

export const PosStoreContext = createContext<ReturnType<typeof createPosStore> | undefined>(undefined);

export interface PosStoreProviderProps {
  children: ReactNode;
}

export const PosStoreProvider = ({ children }: PosStoreProviderProps) => {
  const storeRef = useRef<ReturnType<typeof createPosStore>>(undefined);
  if (!storeRef.current) {
    storeRef.current = createPosStore();
  }
  return (
    <PosStoreContext.Provider value={storeRef.current}>
      {children}
    </PosStoreContext.Provider>
  );
};

export function usePosStoreSelector<T>(selector: (state: PosStore) => T): T {
  const store = useContext(PosStoreContext);
  if (!store) {
    throw new Error("usePosStoreSelector must be used within PosStoreProvider");
  }
  return useStore(store, selector);
}

export function usePosStoreActions() {
  const store = useContext(PosStoreContext);
  if (!store) {
    throw new Error("usePosStoreActions must be used within PosStoreProvider");
  }

  return {
    setCustomerId: useStore(store, (s) => s.setCustomerId),
    addItem: useStore(store, (s) => s.addItem),
    removeItem: useStore(store, (s) => s.removeItem),
    updateQuantity: useStore(store, (s) => s.updateQuantity),
    updateItemDiscount: useStore(store, (s) => s.updateItemDiscount),
    updateItem: useStore(store, (s) => s.updateItem),
    clearCart: useStore(store, (s) => s.clearCart),
    togglePromo: useStore(store, (s) => s.togglePromo),
    clearPromos: useStore(store, (s) => s.clearPromos),
    applyVoucher: useStore(store, (s) => s.applyVoucher),
    removeVoucher: useStore(store, (s) => s.removeVoucher),
    setLoadedBookingId: useStore(store, (s) => s.setLoadedBookingId),
    setLoadedTransactionId: useStore(store, (s) => s.setLoadedTransactionId),
    loadBookingIntoCart: useStore(store, (s) => s.loadBookingIntoCart),
    setIsPaymentModalOpen: useStore(store, (s) => s.setIsPaymentModalOpen),
    setSelectedProduct: useStore(store, (s) => s.setSelectedProduct),
    setSelectedVoucherRedemption: useStore(store, (s) => s.setSelectedVoucherRedemption),
    setIsVipUpgrade: useStore(store, (s) => s.setIsVipUpgrade),
  };
}

export function usePosCart() {
  const store = useContext(PosStoreContext);
  if (!store) {
    throw new Error("usePosCart must be used within PosStoreProvider");
  }

  const items = useStore(store, (s) => s.items);
  const customerId = useStore(store, (s) => s.customerId);
  const setCustomerId = useStore(store, (s) => s.setCustomerId);
  const addItem = useStore(store, (s) => s.addItem);
  const removeItem = useStore(store, (s) => s.removeItem);
  const updateQuantity = useStore(store, (s) => s.updateQuantity);
  const updateItemDiscount = useStore(store, (s) => s.updateItemDiscount);
  const updateItem = useStore(store, (s) => s.updateItem);
  const clearCart = useStore(store, (s) => s.clearCart);
  const appliedPromos = useStore(store, (s) => s.appliedPromos);
  const togglePromo = useStore(store, (s) => s.togglePromo);
  const clearPromos = useStore(store, (s) => s.clearPromos);
  const appliedVoucher = useStore(store, (s) => s.appliedVoucher);
  const applyVoucher = useStore(store, (s) => s.applyVoucher);
  const removeVoucher = useStore(store, (s) => s.removeVoucher);
  const loadedBookingId = useStore(store, (s) => s.loadedBookingId);
  const loadedTransactionId = useStore(store, (s) => s.loadedTransactionId);
  const loadBookingIntoCart = useStore(store, (s) => s.loadBookingIntoCart);
  const isPaymentModalOpen = useStore(store, (s) => s.isPaymentModalOpen);
  const selectedProduct = useStore(store, (s) => s.selectedProduct);
  const selectedVoucherRedemption = useStore(store, (s) => s.selectedVoucherRedemption);
  const isVipUpgrade = useStore(store, (s) => s.isVipUpgrade);
  const setIsVipUpgrade = useStore(store, (s) => s.setIsVipUpgrade);

  let subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  if (isVipUpgrade) subtotal += 80000;
  const itemDiscountTotal = items.reduce((acc, item) => acc + item.discountAmount, 0);
  const promoDiscountTotal = appliedPromos.reduce((acc, promo) => acc + promo.discountAmount, 0);
  const discountTotal = itemDiscountTotal + promoDiscountTotal;
  const totalAmount = subtotal - discountTotal;

  const firstItemTotal = items.length > 0 ? (items[0].unitPrice * items[0].quantity) - items[0].discountAmount : 0;
  const voucherNominalDiscount = appliedVoucher?.remainingCreditAmount ? Math.min(Number(appliedVoucher.remainingCreditAmount), firstItemTotal) : 0;
  const amountDue = totalAmount - voucherNominalDiscount;

  return {
    items,
    customerId,
    setCustomerId,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    updateItem,
    clearCart,
    appliedPromos,
    togglePromo,
    clearPromos,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    subtotal,
    itemDiscountTotal,
    promoDiscountTotal,
    discountTotal,
    totalAmount,
    amountDue,
    voucherNominalDiscount,
    loadedBookingId,
    loadedTransactionId,
    loadBookingIntoCart,
    isPaymentModalOpen,
    selectedProduct,
    selectedVoucherRedemption,
    isVipUpgrade,
    setIsVipUpgrade,
  };
}
