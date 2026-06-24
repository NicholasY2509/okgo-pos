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

interface PosState {
  items: CartItem[];
  customerId: string | undefined;
}

interface PosActions {
  setCustomerId: (id: string | undefined) => void;
  addItem: (item: Omit<CartItem, "cartId">) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateItemDiscount: (cartId: string, discountAmount: number) => void;
  clearCart: () => void;
}

export type PosStore = PosState & PosActions;

export const createPosStore = () => {
  return createStore<PosStore>()(
    persist(
      (set) => ({
        items: [],
        customerId: undefined,
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
          })),
        removeItem: (cartId) =>
          set((state) => ({
            items: state.items.filter((i) => i.cartId !== cartId),
          })),
        updateQuantity: (cartId, quantity) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, quantity } : i)),
          })),
        updateItemDiscount: (cartId, discountAmount) =>
          set((state) => ({
            items: state.items.map((i) => (i.cartId === cartId ? { ...i, discountAmount } : i)),
          })),
        clearCart: () => set({ items: [], customerId: undefined }),
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

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountTotal = items.reduce((acc, item) => acc + item.discountAmount, 0);
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
    subtotal,
    discountTotal,
    totalAmount,
  };
}
