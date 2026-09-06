import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/steps/step-summary.tsx', 'utf8');

const target1 = `  // Calculate Subtotal and Max Duration
  let totalAmount = 0;
  let maxDuration = 0;
  const items = (data.selections || []).map(sel => {
    const service = services.find(s => s.id === sel.serviceId);
    const staff = staffList.find(s => s.id === sel.staffId);
    if (service) {
      totalAmount += Number(service.price);
      if (service.duration > maxDuration) maxDuration = service.duration;
    }
    return { service, staff };
  });`;

const replacement1 = `  // Calculate Subtotal and Max Duration
  let totalAmount = 0;
  let maxDuration = 0;
  const selections = form.watch("selections") || [];
  const items = selections.map(sel => {
    const service = services.find(s => s.id === sel.serviceId);
    const staff = staffList.find(s => s.id === sel.staffId);
    if (service) {
      if (!sel.appliedVoucherId) {
        totalAmount += Number(service.price);
      }
      if (service.duration > maxDuration) maxDuration = service.duration;
    }
    return { service, staff };
  });`;

file = file.replace(target1, replacement1);

const target2 = `  const selections = form.watch("selections") || [];`;
file = file.replace(target2, `  // selections declared above`); // Clean up double declaration

fs.writeFileSync('modules/booking/components/steps/step-summary.tsx', file);
