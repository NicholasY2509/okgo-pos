"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePayrollDetails } from "../hooks/use-payroll";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpdatePayrollItemSchema, type UpdatePayrollItemInput } from "../schemas/payroll";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PayrollItem = {
  id: string;
  name: string;
  type: string;
  amount: any; // Decimal
  isManual: boolean;
  notes?: string | null;
};

type PayrollData = {
  id: string;
  monthPeriod: string;
  status: string;
  baseSalary: any;
  totalAllowance: any;
  totalDeduction: any;
  netSalary: any;
  staff: { firstName: string; lastName: string };
  items: PayrollItem[];
};

export function PayrollDetailsDialog({ payroll, open, onOpenChange }: { payroll: PayrollData | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { handleAddManualItem, handleDeleteItem, handleSettle, isUpdating } = usePayrollDetails();
  const [showAddForm, setShowAddForm] = useState(false);

  const form = useForm<UpdatePayrollItemInput>({
    resolver: zodResolver(UpdatePayrollItemSchema) as any,
    defaultValues: {
      payrollId: payroll?.id || "",
      name: "",
      amount: 0,
      type: "ALLOWANCE",
      notes: "",
    },
  });

  // Update default values when payroll changes
  if (payroll?.id !== form.getValues("payrollId")) {
    form.setValue("payrollId", payroll?.id || "");
  }

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(val || 0));
  };

  const onSubmitAdd = async (values: UpdatePayrollItemInput) => {
    await handleAddManualItem(values, () => {
      setShowAddForm(false);
      form.reset({ payrollId: payroll?.id || "", name: "", amount: 0, type: "ALLOWANCE", notes: "" });
    });
  };

  if (!payroll) return null;

  const isDraft = payroll.status === "DRAFT";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center pr-6">
            <DialogTitle>Slip Gaji: {payroll.staff.firstName} {payroll.staff.lastName}</DialogTitle>
            <Badge variant={isDraft ? "secondary" : "default"}>{payroll.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Periode: {payroll.monthPeriod}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Gaji Pokok</p>
              <p className="font-medium">{formatCurrency(payroll.baseSalary)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gaji Bersih</p>
              <p className="font-bold text-lg text-primary">{formatCurrency(payroll.netSalary)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tunjangan</p>
              <p className="font-medium text-green-600">{formatCurrency(payroll.totalAllowance)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Potongan</p>
              <p className="font-medium text-red-600">{formatCurrency(payroll.totalDeduction)}</p>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Komponen Gaji</h3>
              {isDraft && !showAddForm && (
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Manual
                </Button>
              )}
            </div>

            {showAddForm && (
              <div className="bg-muted p-4 rounded-md mb-4 border">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAdd as any)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control as any}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Komponen</FormLabel>
                            <FormControl>
                              <Input placeholder="cth: Bonus Target" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipe</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ALLOWANCE">Tunjangan (+)</SelectItem>
                                <SelectItem value="DEDUCTION">Potongan (-)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jumlah</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control as any}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Catatan (Opsional)</FormLabel>
                            <FormControl>
                              <Input placeholder="..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" onClick={() => setShowAddForm(false)}>Batal</Button>
                      <Button type="submit" disabled={isUpdating}>Simpan Komponen</Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            <div className="border rounded-md divide-y">
              {payroll.items.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Tidak ada komponen ditemukan.</div>
              ) : (
                payroll.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.name}</span>
                        {item.isManual && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Manual</Badge>}
                      </div>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`font-semibold ${item.type === 'ALLOWANCE' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'ALLOWANCE' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                      {isDraft && item.isManual && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isDraft && !item.isManual && (
                        <div className="w-8"></div> // Placeholder for alignment
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {isDraft && (
          <div className="flex justify-end pt-4 border-t mt-2">
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleSettle(payroll.id, () => onOpenChange(false))}
              disabled={isUpdating}
            >
              Tandai LUNAS (PAID)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
