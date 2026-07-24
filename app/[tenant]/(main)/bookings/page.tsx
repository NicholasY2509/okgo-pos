import { getBookingsAction } from "@/modules/booking/actions/booking-list-actions";
import { BookingList } from "@/modules/booking/components/booking-list";

export default async function TenantBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tenant } = await params;
  const resolvedSearchParams = await searchParams;

  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;

  let from: Date | undefined;
  let to: Date | undefined;

  if (resolvedSearchParams.from) {
    from = new Date(resolvedSearchParams.from as string);
  }

  if (resolvedSearchParams.to) {
    to = new Date(resolvedSearchParams.to as string);
  }

  const isHistory = resolvedSearchParams.history === 'true';

  const filters = { search, from, to, isHistory };

  const res = await getBookingsAction(tenant, filters);

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

        <BookingList
          initialBookings={res.data}
          initialFilters={{
            search: search || "",
            from: from || undefined,
            to: to || undefined,
            isHistory
          }}
        />
      </div>
    </div>
  );
}
