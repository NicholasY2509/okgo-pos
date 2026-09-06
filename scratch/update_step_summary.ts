import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/steps/step-summary.tsx', 'utf8');

const target1 = `  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsVerifying(true);
    setVoucherError("");
    const res = await validateVoucherAction(voucherCode.trim());
    setIsVerifying(false);
    if (res.success && res.data) {
      setAppliedVoucher(res.data);
      form.setValue("appliedVoucherId", res.data.id, { shouldValidate: true });
      toast.success("Voucher berhasil diterapkan!");
    } else {
      setVoucherError(res.error || "Gagal memverifikasi voucher");
      form.setValue("appliedVoucherId", "", { shouldValidate: true });
      setAppliedVoucher(null);
    }
  };

  const handleRemoveVoucher = () => {
    form.setValue("appliedVoucherId", "", { shouldValidate: true });
    setAppliedVoucher(null);
    setVoucherCode("");
    setShowVoucherInput(false);
  };`;

const replacement1 = `  const [appliedVoucher, setAppliedVoucher] = useState<any>(null); // For total discount voucher
  const selections = form.watch("selections") || [];

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsVerifying(true);
    setVoucherError("");
    const res = await validateVoucherAction(voucherCode.trim());
    setIsVerifying(false);
    
    if (res.success && res.data) {
      const voucher = res.data;
      const isServiceVoucher = voucher.voucherPacket?.productId != null;

      if (isServiceVoucher) {
        const requiredProductId = voucher.voucherPacket.productId;
        
        // Find an item in selections that matches requiredProductId AND doesn't have an appliedVoucherId yet
        const currentSelections = form.getValues("selections") || [];
        const matchIndex = currentSelections.findIndex((sel: any) => sel.serviceId === requiredProductId && !sel.appliedVoucherId);
        
        if (matchIndex === -1) {
          const hasMatchingService = currentSelections.some((sel: any) => sel.serviceId === requiredProductId);
          if (hasMatchingService) {
             setVoucherError("Layanan ini sudah menggunakan voucher maksimal (1 per layanan).");
          } else {
             const selectedServiceNames = items.map(i => i.service?.name).filter(Boolean).join(", ");
             const voucherServiceName = voucher.voucherPacket.product?.name || voucher.voucherPacket.name;
             setVoucherError(\`Voucher tidak sesuai. Voucher adalah layanan \${voucherServiceName} sedangkan anda memilih layanan \${selectedServiceNames || "lain"}.\`);
          }
          return;
        }

        // Apply it
        form.setValue(\`selections.\${matchIndex}.appliedVoucherId\`, voucher.id, { shouldValidate: true });
        form.setValue(\`selections.\${matchIndex}.appliedVoucherCode\`, voucher.code, { shouldValidate: true });
        toast.success(\`Voucher layanan \${voucher.code} berhasil diterapkan!\`);
        
      } else {
        // Total voucher
        const currentTotalVoucher = form.getValues("appliedVoucherId");
        if (currentTotalVoucher && currentTotalVoucher !== voucher.id) {
           setVoucherError("Hanya 1 voucher potongan total yang dapat digunakan.");
           return;
        }
        setAppliedVoucher(res.data);
        form.setValue("appliedVoucherId", res.data.id, { shouldValidate: true });
        toast.success("Voucher potongan total berhasil diterapkan!");
      }
      
      setVoucherCode(""); // Clear input
    } else {
      setVoucherError(res.error || "Gagal memverifikasi voucher");
    }
  };

  const handleRemoveVoucher = () => {
    form.setValue("appliedVoucherId", "", { shouldValidate: true });
    setAppliedVoucher(null);
  };
  
  const handleRemoveItemVoucher = (index: number) => {
    form.setValue(\`selections.\${index}.appliedVoucherId\`, undefined, { shouldValidate: true });
    form.setValue(\`selections.\${index}.appliedVoucherCode\`, undefined, { shouldValidate: true });
  };`;

file = file.replace(target1, replacement1);

const target2 = `        <div className="space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Daftar Layanan
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-background rounded-2xl p-4 shadow-sm border border-border/50">
                <div className="flex items-start gap-3">
                  <div>
                    <div className="text-sm font-medium">{item.service?.name || "Tidak memilih layanan spesifik"}</div>
                    {item.service && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="w-3 h-3" /> {item.staff?.firstName || "Terapis: Siapa Saja"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {item.service ? \`Rp \${Number(item.service.price || 0).toLocaleString('id-ID')}\` : "Rp 0"}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.service?.duration || 60} mnt</div>
                </div>
              </div>
            ))}
          </div>
        </div>`;

const replacement2 = `        <div className="space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Daftar Layanan
          </div>

          <div className="space-y-3">
            {items.map((item, i) => {
              const itemSelection = selections[i];
              const appliedItemVoucher = itemSelection?.appliedVoucherCode;
              const hasVoucher = !!appliedItemVoucher;
              
              return (
              <div key={i} className="flex flex-col bg-background rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.service?.name || "Tidak memilih layanan spesifik"}</div>
                      {item.service && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <User className="w-3 h-3" /> {item.staff?.firstName || "Terapis: Siapa Saja"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {hasVoucher ? (
                        <div className="text-xs text-muted-foreground line-through">
                           {item.service ? \`Rp \${Number(item.service.price || 0).toLocaleString('id-ID')}\` : "Rp 0"}
                        </div>
                      ) : (
                         item.service ? \`Rp \${Number(item.service.price || 0).toLocaleString('id-ID')}\` : "Rp 0"
                      )}
                      {hasVoucher && <div className="text-primary font-bold">Gratis</div>}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.service?.duration || 60} mnt</div>
                  </div>
                </div>
                
                {hasVoucher && (
                  <div className="flex justify-between items-center bg-primary/5 border border-primary/20 rounded-xl p-3 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/20 p-1.5 rounded-full text-primary">
                        <Ticket className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">{appliedItemVoucher}</div>
                        <div className="text-[10px] text-primary">Voucher Layanan</div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItemVoucher(i)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full text-xs h-7 px-2">
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>`;

file = file.replace(target2, replacement2);

fs.writeFileSync('modules/booking/components/steps/step-summary.tsx', file);
