"use client";

import { useState } from "react";
import { usePosCart } from "../stores/pos-store";
import { PosCart } from "./pos-cart";
import { PaymentModal } from "./payment-modal";
import { Store } from "lucide-react";
import { ServiceList } from "./service-list";
import { VoucherPacketList } from "./voucher-packet-list";
import { ServiceSelectionDialog } from "./service-selection-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PosClientProps {
  branchId: string;
  tenant: string;
  products: any[];
  voucherPackets: any[];
  staff: any[];
  rooms: any[];
  paymentMethods: any[];
  customers: any[];
}

export function PosClient({ branchId, tenant, products, voucherPackets, staff, rooms, paymentMethods, customers }: PosClientProps) {
  const cart = usePosCart();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // State for Service Selection Dialog
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
  };

  const handleAddServiceToCart = (staffId: string, roomId: string) => {
    if (!selectedProduct || !staffId || !roomId) return;

    const staffMember = staff.find(s => s.id === staffId);
    const room = rooms.find(r => r.id === roomId);

    cart.addItem({
      type: "SERVICE",
      serviceId: selectedProduct.id,
      quantity: 1, // Force to 1 as recommended
      staffId: staffId,
      roomId: roomId,
      discountAmount: 0,
      name: selectedProduct.name,
      unitPrice: Number(selectedProduct.price),
      staffName: staffMember?.firstName + " " + (staffMember?.lastName || ""),
      roomName: room?.name,
    });

    setSelectedProduct(null);
  };

  const handleVoucherPacketClick = (packet: any) => {
    cart.addItem({
      type: "VOUCHER_PACKET",
      voucherPacketId: packet.id,
      quantity: 1,
      discountAmount: 0,
      name: packet.name,
      unitPrice: Number(packet.price),
    });
  };

  return (
    <div className="flex h-full gap-6 bg-muted/30 p-2 rounded-xl">
      <div className="flex-1 bg-background p-6 md:p-8 rounded-2xl shadow-sm border border-border overflow-y-auto flex flex-col">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="services">Layanan</TabsTrigger>
            <TabsTrigger value="vouchers">Paket Voucher</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0">
            <ServiceList products={products} onProductClick={handleProductClick} />
          </TabsContent>

          <TabsContent value="vouchers" className="mt-0">
            <VoucherPacketList voucherPackets={voucherPackets} onVoucherPacketClick={handleVoucherPacketClick} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-[400px] shrink-0 flex flex-col sticky top-20 h-[calc(100vh-8rem)] min-h-[500px]">
        <PosCart
          cart={cart}
          customers={customers}
          onCheckout={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* Service Selection Dialog */}
      <ServiceSelectionDialog
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        staff={staff}
        rooms={rooms}
        onAddServiceToCart={handleAddServiceToCart}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          cart={cart}
          branchId={branchId}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            cart.clearCart();
          }}
        />
      )}
    </div>
  );
}
