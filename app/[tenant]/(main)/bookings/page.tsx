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

  let date: Date | undefined;
  let from: Date | undefined;
  let to: Date | undefined;

  if (typeof resolvedSearchParams.date === 'string') {
    const [year, month, day] = resolvedSearchParams.date.split('-').map(Number);
    if (year && month && day) {
      date = new Date(year, month - 1, day, 0, 0, 0, 0);
      from = date;
      to = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      date = new Date(resolvedSearchParams.date);
      from = date;
      to = date;
    }
  } else if (typeof resolvedSearchParams.from === 'string') {
    from = new Date(resolvedSearchParams.from);
    date = from;
    if (typeof resolvedSearchParams.to === 'string') {
      to = new Date(resolvedSearchParams.to);
    }
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
            date,
            from,
            to,
            isHistory
          }}
        />
      </div>
    </div>
  );
}
