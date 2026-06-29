"use client";

import { usePosStoreSelector, usePosStoreActions } from "../../stores/pos-store";
import { CustomerSelector } from "../customer-selector";

export function CartCustomer() {
  const customerId = usePosStoreSelector((state) => state.customerId);
  const { setCustomerId } = usePosStoreActions();

  return (
    <CustomerSelector
      value={customerId}
      onChange={setCustomerId}
    />
  );
}
