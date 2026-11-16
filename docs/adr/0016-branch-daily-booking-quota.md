# 0016. Branch Daily Booking Quota

Date: 2026-11-15
Status: Accepted

## Context

Branches need the ability to cap how many booking slots they accept per day from the admin dashboard, independent of raw room and therapist capacity (for example, to manage operational load, walk-in buffer, or soft-launch limits).

Previously, booking availability was determined solely by room capacity (`Room.capacity`) and therapist availability per time slot, with no daily branch-level ceiling.

## Decision

1. **Schema**: Add `maxDailyBookings Int?` to `Branch` in `prisma/schema/branch.prisma`.
   - `null` means unlimited (availability follows room and therapist capacity only).
   - A positive integer sets the maximum number of booking service slots accepted per calendar day in `Asia/Jakarta` (`UTC+07:00`).
2. **Slot Counting Rule**: Each booking consumes slots equal to its service count (`sum(BookingItem.quantity)`, falling back to `max(guestCount, 1)` when no items are attached). For example, 1 booking with 3 services consumes 3 daily slots.
3. **Included Statuses**: Bookings with status `PENDING` or `PROCESSED` count toward the daily quota; `CANCELLED` bookings do not.
4. **Enforcement Points**:
   - `BookingRepository.createBooking` and `BookingRepository.updateBooking` validate the daily quota inside the Prisma transaction before creating or updating a booking.
   - `BookingRepository.getAvailableSlots` and `BookingRepository.getDailySchedule` expose and apply the remaining daily quota so unavailable dates/slots are reflected in both admin and customer booking flows.
5. **Admin UI**: Add a "Pengaturan" (`?tab=settings`) tab on `/admin/branches/[slug]` following the 5-layer module pattern (`BranchSettingsTab -> useBranchSettings -> updateBranchSettingsAction -> BranchService -> BranchRepository`).

## Consequences

- Admins can configure or remove a branch's daily booking limit without affecting existing room or staff schedules.
- Existing branches default to `maxDailyBookings = null` (no change in behavior until configured).
- Requires running `npx prisma db push` (or migration) to add the nullable `maxDailyBookings` column to `Branch`.
