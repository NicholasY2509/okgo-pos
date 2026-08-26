import { PayrollEngine } from "../modules/payroll/services/payroll-engine";
import { prisma } from "../lib/prisma";

async function run() {
  console.log("Testing Payroll Engine...");

  const staff = await prisma.staff.findFirst();
  if (!staff) {
    console.log("No staff found to test with.");
    return;
  }

  console.log("Selected staff:", staff.firstName, staff.lastName);

  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

  const monthPeriod = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;

  try {
    const payroll = await PayrollEngine.generatePayroll({
      staffId: staff.id,
      monthPeriod,
      startDate,
      endDate,
    });
    console.log("Payroll generated successfully:", JSON.stringify(payroll, null, 2));
  } catch (e: any) {
    console.error("Failed to generate payroll:", e.message);
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
