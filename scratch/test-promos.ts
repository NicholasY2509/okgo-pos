import { prisma } from '../lib/prisma';
import { PromotionService } from '../modules/discount/services/promotion-service';

async function main() {
  console.log("Cleaning up old promotions...");
  await prisma.promotion.deleteMany({});

  console.log("Creating test promotions...");
  // 1. Every Wed, 2 services = 15%
  await prisma.promotion.create({
    data: {
      name: "Rabu Berdua 15%",
      isActive: true,
      schedules: [{ days: ["WEDNESDAY"], startTime: "00:00", endTime: "23:59" }],
      conditions: { minQuantity: 2 },
      reward: { type: "PERCENTAGE_TOTAL", value: 15 }
    }
  });

  // 2. Mon-Fri Morning 20%
  await prisma.promotion.create({
    data: {
      name: "Pagi Weekday 20%",
      isActive: true,
      schedules: [{ 
        days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], 
        startTime: "09:00", 
        endTime: "11:30" 
      }],
      conditions: null, // Any quantity, any product
      reward: { type: "PERCENTAGE_TOTAL", value: 20 }
    }
  });

  // 3. Javanese Buy 90 Get 30
  await prisma.promotion.create({
    data: {
      name: "Javanese +30m Sunday Morning",
      isActive: true,
      schedules: [{ days: ["SUNDAY"], startTime: "09:00", endTime: "11:30" }],
      conditions: { minQuantity: 1, requiredServiceIds: ["javanese_90_id"] },
      reward: { type: "FREE_ADDON", addonServiceId: "30m_extension_id" }
    }
  });

  console.log("Testing Scenarios...");

  // Override current time for testing.
  // We'll just temporarily override the Service class logic, or mock the Date.
  // Actually, mocking Date in JS is easy:
  const RealDate = Date;
  
  // Test Scenario 1: Wednesday 10:00 AM, 2 items in cart
  console.log("\n--- Scenario 1: Wednesday 10:00 AM, 2 items ---");
  global.Date = class extends RealDate {
    constructor() {
      super();
      // Wed, Aug 19 2026 10:00:00
      return new RealDate('2026-08-19T10:00:00+07:00');
    }
  } as any;
  const eligible1 = await PromotionService.getEligiblePromotions([
    { serviceId: "foo", quantity: 1, unitPrice: 100000 },
    { serviceId: "bar", quantity: 1, unitPrice: 100000 }
  ], "any_branch");
  console.log(eligible1); // Should match "Rabu Berdua" AND "Pagi Weekday"

  // Test Scenario 2: Sunday 10:00 AM, Javanese in cart
  console.log("\n--- Scenario 2: Sunday 10:00 AM, Javanese in cart ---");
  global.Date = class extends RealDate {
    constructor() {
      super();
      // Sun, Aug 16 2026 10:00:00
      return new RealDate('2026-08-16T10:00:00+07:00');
    }
  } as any;
  const eligible2 = await PromotionService.getEligiblePromotions([
    { serviceId: "javanese_90_id", quantity: 1, unitPrice: 150000 }
  ], "any_branch");
  console.log(eligible2); // Should match "Javanese +30m"

  global.Date = RealDate;
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
