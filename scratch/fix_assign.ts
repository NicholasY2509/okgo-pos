import * as fs from 'fs';

let file = fs.readFileSync('modules/pos/components/timetable/assign-booking-modal.tsx', 'utf8');

const target1 = `                      name={\`selections.\${index}.staffId\`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terapis (Opsional)</FormLabel>
                          <FormControl>
                            <StaffCombobox
                              branchId={branchId!}
                              value={field.value || ""}
                              onChange={(val) => field.onChange(val || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />`;

const replacement1 = `                      name={\`selections.\${index}.staffId\`}
                      render={({ field }) => {
                        const selectedServiceId = form.watch(\`selections.\${index}.serviceId\`);
                        return (
                        <FormItem>
                          <FormLabel>Terapis (Opsional)</FormLabel>
                          <FormControl>
                            <StaffCombobox
                              branchId={branchId!}
                              serviceId={selectedServiceId}
                              value={field.value || ""}
                              onChange={(val) => field.onChange(val || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}}
                    />`;

file = file.replace(target1, replacement1);
fs.writeFileSync('modules/pos/components/timetable/assign-booking-modal.tsx', file);
