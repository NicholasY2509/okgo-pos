import { getBookingsAction } from "@/modules/booking/actions/booking-list-actions";
import { BookingList } from "@/modules/booking/components/booking-list";

export default async function TenantBookingsPage({
  params
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant } = await params;
  const res = await getBookingsAction(tenant);

  if (!res.success) {
    return <div className="p-12 text-center text-destructive">Error memuat daftar booking: {res.error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto w-full">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Daftar Booking</h2>
          <p className="text-muted-foreground mt-1">Kelola dan lihat daftar booking yang masuk.</p>
        </div>

        <BookingList initialBookings={res.data} />
      </div>
    </div>
  );
}
