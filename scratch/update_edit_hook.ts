import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/hooks/use-edit-booking-form.ts', 'utf8');

const target = `  const initialSelections = booking?.items?.map((item: any) => {
    const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
    return {
      serviceId: item.serviceId,
      staffId: session?.staffId || undefined,
    };
  }) || [{ serviceId: "", staffId: undefined }];`;

const replacement = `  const initialSelections = booking?.items?.map((item: any) => {
    const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
    return {
      serviceId: item.serviceId,
      staffId: session?.staffId || undefined,
      appliedVoucherId: item.appliedVoucherId || undefined,
      appliedVoucherCode: item.appliedVoucher?.code || undefined,
    };
  }) || [{ serviceId: "", staffId: undefined }];`;

file = file.replace(target, replacement);
fs.writeFileSync('modules/booking/hooks/use-edit-booking-form.ts', file);
