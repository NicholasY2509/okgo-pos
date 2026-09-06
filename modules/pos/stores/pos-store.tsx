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
};

interface PosState {
  items: CartItem[];
  customerId: string | undefined;
  appliedPromo: AppliedPromo | null;
  loadedBookingId: string | null;
  loadedTransactionId: string | null;
}

interface PosActions {
  setCustomerId: (id: string | undefined) => void;
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateItemDiscount: (cartId: string, discountAmount: number) => void;
  clearCart: () => void;
  applyPromo: (promo: AppliedPromo) => void;
  removePromo: () => void;
  setLoadedBookingId: (id: string | null) => void;
  setLoadedTransactionId: (id: string | null) => void;
  loadBookingIntoCart: (booking: any) => void;
}

export type PosStore = PosState & PosActions;

export const createPosStore = () => {
  return createStore<PosStore>()(
    persist(
      (set) => ({
        items: [],
        customerId: undefined,
        appliedPromo: null,
        loadedBookingId: null,
        loadedTransactionId: null,
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
            appliedPromo: null,
          })),
        removeItem: (cartId) =>
          set((state) => ({
            items: state.items.filter((i) => i.cartId !== cartId),
            // Auto remove promo when items are removed
            appliedPromo: null,
          })),
        updateQuantity: (cartId, quantity) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, quantity } : i)),
            // Auto remove promo when quantity changes
            appliedPromo: null,
          })),
        updateItemDiscount: (cartId, discountAmount) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, discountAmount } : i)),
            appliedPromo: null,
          })),
        clearCart: () => set({ items: [], customerId: undefined, appliedPromo: null, loadedBookingId: null, loadedTransactionId: null }),
        applyPromo: (promo) => set({ appliedPromo: promo }),
        removePromo: () => set({ appliedPromo: null }),
        setLoadedBookingId: (loadedBookingId) => set({ loadedBookingId }),
        setLoadedTransactionId: (loadedTransactionId) => set({ loadedTransactionId }),
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
            appliedPromo: null,
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
    clearCart: useStore(store, (s) => s.clearCart),
    applyPromo: useStore(store, (s) => s.applyPromo),
    removePromo: useStore(store, (s) => s.removePromo),
    setLoadedBookingId: useStore(store, (s) => s.setLoadedBookingId),
    setLoadedTransactionId: useStore(store, (s) => s.setLoadedTransactionId),
    loadBookingIntoCart: useStore(store, (s) => s.loadBookingIntoCart),
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
  const clearCart = useStore(store, (s) => s.clearCart);
  const appliedPromo = useStore(store, (s) => s.appliedPromo);
  const applyPromo = useStore(store, (s) => s.applyPromo);
  const removePromo = useStore(store, (s) => s.removePromo);
  const loadedBookingId = useStore(store, (s) => s.loadedBookingId);
  const loadedTransactionId = useStore(store, (s) => s.loadedTransactionId);
  const loadBookingIntoCart = useStore(store, (s) => s.loadBookingIntoCart);

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const itemDiscountTotal = items.reduce((acc, item) => acc + item.discountAmount, 0);
  const promoDiscountTotal = appliedPromo ? appliedPromo.discountAmount : 0;
  const discountTotal = itemDiscountTotal + promoDiscountTotal;
  const totalAmount = subtotal - discountTotal;

  return {
    items,
    customerId,
    setCustomerId,
    addItem,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    clearCart,
    appliedPromo,
    applyPromo,
    removePromo,
    subtotal,
    itemDiscountTotal,
    promoDiscountTotal,
    discountTotal,
    totalAmount,
    loadedBookingId,
    loadedTransactionId,
    loadBookingIntoCart,
  };
}
