import { StaffIncentiveRepository } from "./modules/staff-incentive/repositories/staff-incentive-repository";
async function main() {
  const result = await StaffIncentiveRepository.getStaffIncentiveDetails({
    staffId: "clzoi3y3w000a4023u027w26y", // Susy 94 maybe? We need a real staff id
    type: "SERVICE_COMMISSION"
  });
  console.log(result);
}
main();
