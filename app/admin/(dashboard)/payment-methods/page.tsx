import { PaymentMethodService } from "@/modules/payment-method/services/payment-method-service";
import { PaymentMethodList } from "@/modules/payment-method/components/payment-method-list";

import { LedgerAccountService } from "@/modules/accounting/services/ledger-account-service";

export const metadata = {
  title: "Payment Methods | Admin",
};

export default async function PaymentMethodsPage() {
  const paymentMethods = await PaymentMethodService.getAll();
  const accounts = await LedgerAccountService.getAll(); // get global or all accounts

  return (
    <div className="flex-1 space-y-4">
      <PaymentMethodList data={paymentMethods} accounts={accounts} />
    </div>
  );
}
