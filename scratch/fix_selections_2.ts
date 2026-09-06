import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/steps/step-summary.tsx', 'utf8');

const target1 = `  const [appliedVoucher, setAppliedVoucher] = useState<any>(null); // For total discount voucher
  const selections = form.watch("selections") || [];

  const handleApplyVoucher = async () => {`;

const replacement1 = `  const [appliedVoucher, setAppliedVoucher] = useState<any>(null); // For total discount voucher

  const handleApplyVoucher = async () => {`;

file = file.replace(target1, replacement1);
fs.writeFileSync('modules/booking/components/steps/step-summary.tsx', file);
