import { PaymentMethodService } from "@/modules/payment-method/services/payment-method-service";
import { PaymentMethodList } from "@/modules/payment-method/components/payment-method-list";

export const metadata = {
  title: "Payment Methods | Admin",
};

export default async function PaymentMethodsPage() {
  const paymentMethods = await PaymentMethodService.getAll();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PaymentMethodList data={paymentMethods} />
    </div>
  );
}
