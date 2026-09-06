import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/steps/step-summary.tsx', 'utf8');

const target1 = `  // Calculate Subtotal and Max Duration
  let totalAmount = 0;
  let maxDuration = 0;
  // selections declared above
  const items = selections.map(sel => {`;

const replacement1 = `  // Calculate Subtotal and Max Duration
  const selections = form.watch("selections") || [];
  let totalAmount = 0;
  let maxDuration = 0;
  const items = selections.map(sel => {`;

file = file.replace(target1, replacement1);
fs.writeFileSync('modules/booking/components/steps/step-summary.tsx', file);
