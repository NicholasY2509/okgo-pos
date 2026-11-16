export interface QuotaBookingRecord {
  guestCount?: number | null
  items?: { quantity: number }[]
}

export interface DailyBookingQuotaStatus {
  maxDailyBookings: number | null
  usedSlots: number
  remainingDailyQuota: number | null
}

/**
 * Counts how many daily booking slots a single booking consumes.
 * Each service item counts as `quantity` slots, falling back to `guestCount` or 1.
 */
export function countBookingSlots(booking: QuotaBookingRecord): number {
  const itemSlots = (booking.items ?? []).reduce(
    (sum, item) => sum + Math.max(1, item.quantity || 1),
    0
  )
  return Math.max(itemSlots, booking.guestCount ?? 1, 1)
}

/**
 * Counts how many daily booking slots a new/updated booking request will consume.
 */
export function countRequestedBookingSlots(selections?: unknown[] | null): number {
  return Math.max(1, selections?.length ?? 0)
}

/**
 * Computes the remaining daily booking quota for a branch on a given day.
 */
export function calculateDailyQuota(
  maxDailyBookings: number | null | undefined,
  bookings: QuotaBookingRecord[]
): DailyBookingQuotaStatus {
  const usedSlots = bookings.reduce((sum, b) => sum + countBookingSlots(b), 0)

  if (maxDailyBookings == null || maxDailyBookings <= 0) {
    return {
      maxDailyBookings: null,
      usedSlots,
      remainingDailyQuota: null,
    }
  }

  return {
    maxDailyBookings,
    usedSlots,
    remainingDailyQuota: Math.max(0, maxDailyBookings - usedSlots),
  }
}

/**
 * Checks whether the remaining daily quota can accommodate `requestedSlots`.
 */
export function hasEnoughDailyQuota(
  quota: DailyBookingQuotaStatus,
  requestedSlots: number
): boolean {
  if (quota.maxDailyBookings === null || quota.remainingDailyQuota === null) {
    return true
  }
  return quota.remainingDailyQuota >= requestedSlots
}
