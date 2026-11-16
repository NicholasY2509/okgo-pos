import { describe, expect, it } from "vitest"
import {
  calculateDailyQuota,
  countBookingSlots,
  countRequestedBookingSlots,
  hasEnoughDailyQuota,
} from "./daily-booking-quota"

describe("daily-booking-quota", () => {
  describe("countBookingSlots", () => {
    it("counts 1 booking with 3 services as 3 slots", () => {
      expect(
        countBookingSlots({
          guestCount: 3,
          items: [{ quantity: 1 }, { quantity: 1 }, { quantity: 1 }],
        })
      ).toBe(3)
    })

    it("sums item quantities when quantity > 1", () => {
      expect(
        countBookingSlots({
          guestCount: 1,
          items: [{ quantity: 2 }, { quantity: 1 }],
        })
      ).toBe(3)
    })

    it("falls back to guestCount or 1 when items are empty", () => {
      expect(countBookingSlots({ guestCount: 2, items: [] })).toBe(2)
      expect(countBookingSlots({ guestCount: null, items: [] })).toBe(1)
    })
  })

  describe("countRequestedBookingSlots", () => {
    it("counts selections length with minimum of 1", () => {
      expect(countRequestedBookingSlots(undefined)).toBe(1)
      expect(countRequestedBookingSlots([])).toBe(1)
      expect(countRequestedBookingSlots([{}, {}, {}])).toBe(3)
    })
  })

  describe("calculateDailyQuota", () => {
    it("returns unlimited quota when maxDailyBookings is null", () => {
      const quota = calculateDailyQuota(null, [
        { guestCount: 3, items: [{ quantity: 1 }, { quantity: 1 }, { quantity: 1 }] },
      ])
      expect(quota).toEqual({
        maxDailyBookings: null,
        usedSlots: 3,
        remainingDailyQuota: null,
      })
      expect(hasEnoughDailyQuota(quota, 5)).toBe(true)
    })

    it("calculates used and remaining slots accurately", () => {
      const quota = calculateDailyQuota(10, [
        { guestCount: 3, items: [{ quantity: 1 }, { quantity: 1 }, { quantity: 1 }] },
        { guestCount: 2, items: [{ quantity: 1 }, { quantity: 1 }] },
      ])
      expect(quota).toEqual({
        maxDailyBookings: 10,
        usedSlots: 5,
        remainingDailyQuota: 5,
      })
      expect(hasEnoughDailyQuota(quota, 5)).toBe(true)
      expect(hasEnoughDailyQuota(quota, 6)).toBe(false)
    })

    it("clamps remainingDailyQuota at 0 when over limit", () => {
      const quota = calculateDailyQuota(4, [
        { guestCount: 5, items: [{ quantity: 5 }] },
      ])
      expect(quota.remainingDailyQuota).toBe(0)
      expect(hasEnoughDailyQuota(quota, 1)).toBe(false)
    })
  })
})
