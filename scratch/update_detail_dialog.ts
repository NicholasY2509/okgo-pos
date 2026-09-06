import * as fs from 'fs';

let file = fs.readFileSync('modules/booking/components/booking-detail-dialog.tsx', 'utf8');

const target1 = `                  <div className="space-y-2">
                    {booking.items?.map((item: any, i: number) => {
                      const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
                      return (
                        <div key={i} className="flex justify-between items-start text-sm border p-3 rounded-lg bg-muted/20">
                          <div>
                            <p className="font-medium">{item.itemNameSnapshot}</p>
                            <p className="text-xs text-muted-foreground">{item.categoryName || "Lainnya"}</p>
                            {session?.staff && (
                              <p className="text-muted-foreground text-xs mt-1">
                                Terapis: {session.staff.name}
                              </p>
                            )}
                          </div>
                          <p className="font-medium">{formatIDR(Number(item.unitPrice))}</p>
                        </div>
                      )
                    })}
                  </div>`;

const replacement1 = `                  <div className="space-y-2">
                    {booking.items?.map((item: any, i: number) => {
                      const session = booking.serviceSessions?.find((s: any) => s.serviceId === item.serviceId);
                      const hasVoucher = !!item.appliedVoucher;
                      return (
                        <div key={i} className="flex flex-col border p-3 rounded-lg bg-muted/20 space-y-2">
                          <div className="flex justify-between items-start text-sm">
                            <div>
                              <p className="font-medium">{item.itemNameSnapshot}</p>
                              <p className="text-xs text-muted-foreground">{item.categoryName || "Lainnya"}</p>
                              {session?.staff && (
                                <p className="text-muted-foreground text-xs mt-1">
                                  Terapis: {session.staff.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {hasVoucher ? (
                                <div className="text-xs text-muted-foreground line-through">
                                  {formatIDR(Number(item.unitPrice))}
                                </div>
                              ) : null}
                              <p className="font-medium">{formatIDR(hasVoucher ? 0 : Number(item.unitPrice))}</p>
                            </div>
                          </div>
                          {hasVoucher && (
                            <div className="flex items-center gap-2 bg-primary/5 text-primary text-xs px-2 py-1.5 rounded-md border border-primary/20 w-fit">
                              <Ticket className="w-3 h-3" />
                              <span>Voucher Layanan: <b>{item.appliedVoucher.code}</b></span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>`;

file = file.replace(target1, replacement1);

const target2 = `                            const originalAmount = booking.items?.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0) || 0;`;
const replacement2 = `                            const originalAmount = booking.items?.reduce((sum: number, item: any) => sum + Number(item.unitPrice * item.quantity), 0) || 0;`;

// Replace all instances of target2 (there are 3)
file = file.replaceAll(target2, replacement2);

fs.writeFileSync('modules/booking/components/booking-detail-dialog.tsx', file);
