import { UseFormReturn } from "react-hook-form";
import { BookingInput } from "../../schemas/booking";

interface StepIdentityProps {
  form: UseFormReturn<BookingInput>;
  branches: any[];
  loadingBranches?: boolean;
}

export function StepIdentity({ form, branches, loadingBranches }: StepIdentityProps) {
  const selectedBranchId = form.watch("branchId");

  return (
    <div className="space-y-10 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="space-y-1 text-left">
        <h2 className="text-3xl font-display font-light tracking-tight">Halo! Mari atur jadwalmu.</h2>
        <p className="text-muted-foreground font-light text-sm">Silakan isi data diri dan pilih cabang terdekat.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Nama Lengkap</label>
          <input
            type="text"
            {...form.register("customerName")}
            placeholder="Contoh: Budi Santoso"
            className="w-full bg-muted/30 px-6 py-4 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-shadow placeholder:text-muted-foreground/50"
          />
          {form.formState.errors.customerName && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.customerName.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2">Nomor WhatsApp</label>
          <input
            type="tel"
            {...form.register("customerPhone")}
            placeholder="Contoh: 08123456789"
            className="w-full bg-muted/30 px-6 py-4 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-primary text-sm transition-shadow placeholder:text-muted-foreground/50"
          />
          {form.formState.errors.customerPhone && <p className="text-xs text-destructive ml-2 mt-1">{form.formState.errors.customerPhone.message}</p>}
        </div>

        <div className="space-y-3 pt-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-2 block">Pilih Cabang</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingBranches ? (
              <>
                <div className="rounded-2xl border border-border/50 bg-muted/10 h-[92px] animate-pulse"></div>
                <div className="rounded-2xl border border-border/50 bg-muted/10 h-[92px] animate-pulse hidden sm:block"></div>
              </>
            ) : branches.map(branch => (
              <div
                key={branch.id}
                className={`p-6 cursor-pointer transition-all rounded-2xl border flex flex-col justify-center items-center text-center ${selectedBranchId === branch.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border/50 bg-muted/10 hover:bg-muted/30'}`}
                onClick={() => form.setValue("branchId", branch.id, { shouldValidate: true })}
              >
                <div className="font-medium text-foreground mb-1">{branch.name}</div>
                <div className="text-xs text-muted-foreground font-light line-clamp-1">{branch.address || "Lokasi"}</div>
              </div>
            ))}
          </div>
          {form.formState.errors.branchId && <p className="text-xs text-destructive ml-2">{form.formState.errors.branchId.message}</p>}
        </div>
      </div>
    </div>
  );
}
