import { prisma } from "../lib/prisma";
async function run() {
  const discounts = await prisma.discount.findMany();
  console.log("All discounts:", discounts);
  
  const now = new Date();
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const currentDay = days[now.getDay()];
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  console.log("currentTime:", currentTime);
  console.log("currentDay:", currentDay);
}
run();
