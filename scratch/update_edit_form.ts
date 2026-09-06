import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/edit-booking-form.tsx', 'utf8');

const target = `                <FormField
                  control={form.control}
                  name={\`selections.\${index}.staffId\` as const}
                  render={({ field: sf }) => {
                    const currentServiceId = form.watch(\`selections.\${index}.serviceId\`);
                    return (
                      <FormItem>
                        <FormLabel>Terapis (Opsional)</FormLabel>
                        <FormControl>
                          <StaffCombobox
                            branchId={branchId}
                            serviceId={currentServiceId}
                            value={sf.value || ""}
                            onChange={(val) => sf.onChange(val || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            ))}
          </div>`;

const replacement = `                <FormField
                  control={form.control}
                  name={\`selections.\${index}.staffId\` as const}
                  render={({ field: sf }) => {
                    const currentServiceId = form.watch(\`selections.\${index}.serviceId\`);
                    return (
                      <FormItem>
                        <FormLabel>Terapis (Opsional)</FormLabel>
                        <FormControl>
                          <StaffCombobox
                            branchId={branchId}
                            serviceId={currentServiceId}
                            value={sf.value || ""}
                            onChange={(val) => sf.onChange(val || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                
                {(() => {
                  const voucherCode = form.watch(\`selections.\${index}.appliedVoucherCode\`);
                  if (!voucherCode) return null;
                  return (
                    <div className="flex justify-between items-center bg-primary/5 text-primary text-xs px-3 py-2 rounded-md border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        <span>Voucher Layanan: <b>{voucherCode}</b></span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          form.setValue(\`selections.\${index}.appliedVoucherId\`, undefined, { shouldValidate: true });
                          form.setValue(\`selections.\${index}.appliedVoucherCode\`, undefined, { shouldValidate: true });
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>`;

file = file.replace(target, replacement);
fs.writeFileSync('modules/booking/components/edit-booking-form.tsx', file);
