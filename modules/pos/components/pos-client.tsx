"use client";

import { usePosClient } from "../hooks/use-pos-client";
import { PosCart } from "./pos-cart";
import { PaymentModal } from "./payment-modal";
import { ServiceList } from "./service-list";
import { VoucherPacketList } from "./voucher-packet-list";
import { ServiceSelectionDialog } from "./service-selection-dialog";
import { VoucherRedeemTab } from "./voucher-redeem-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminBookingForm } from "../../booking/components/admin-booking-form";
import { useState } from "react";

interface PosClientProps {
  branchId: string;
  products: any[];
  voucherPackets: any[];
  staff: any[];
  rooms: any[];
  paymentMethods: any[];
  customers: any[];
  activeDiscount: number;
}

export function PosClient({ branchId, products, voucherPackets, staff, rooms, paymentMethods, customers, activeDiscount }: PosClientProps) {
  const {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedProduct,
    setSelectedProduct,
    setSelectedVoucherRedemption,
    handleProductClick,
    handleRedeemVoucherClick,
    handleAddServiceToCart,
    handleVoucherPacketClick,
    clearCart,
  } = usePosClient({ staff, rooms, activeDiscount, branchId });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  return (
    <div className="flex h-full gap-6 bg-muted/30 p-2 rounded-xl">
      <div className="flex-1 bg-background p-6 md:p-8 rounded-2xl shadow-sm border border-border overflow-y-auto flex flex-col">
        <Tabs defaultValue="services" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-[600px] grid-cols-3">
              <TabsTrigger value="services">Layanan</TabsTrigger>
              <TabsTrigger value="vouchers">Paket Voucher</TabsTrigger>
              <TabsTrigger value="redeem">Redeem Voucher</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Booking
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Buat Booking Baru</DialogTitle>
                  </DialogHeader>
                  <AdminBookingForm
                    branchId={branchId}
                    onSuccess={() => setIsBookingModalOpen(false)}
                    onCancel={() => setIsBookingModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Button variant="outline" asChild>
                <a href={`/timetable`}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Lihat Jadwal
                </a>
              </Button>
            </div>
          </div>

          <TabsContent value="services" className="mt-0">
            <ServiceList products={products} onProductClick={handleProductClick} />
          </TabsContent>

          <TabsContent value="vouchers" className="mt-0">
            <VoucherPacketList voucherPackets={voucherPackets} onVoucherPacketClick={handleVoucherPacketClick} />
          </TabsContent>

          <TabsContent value="redeem" className="mt-0">
            <VoucherRedeemTab customers={customers} onRedeemVoucher={handleRedeemVoucherClick} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="w-[400px] shrink-0 flex flex-col sticky top-20 h-[calc(100vh-8rem)] min-h-[500px]">
        <PosCart
          customers={customers}
          onCheckout={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* Service Selection Dialog */}
      <ServiceSelectionDialog
        selectedProduct={selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          setSelectedVoucherRedemption(null);
        }}
        staff={staff}
        rooms={rooms}
        onAddServiceToCart={handleAddServiceToCart}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          branchId={branchId}
          paymentMethods={paymentMethods}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            clearCart();
          }}
        />
      )}
    </div>
  );
}
