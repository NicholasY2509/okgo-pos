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
          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Nama Lengkap</label>
          <input
            type="text"
            {...form.register("customerName")}
            placeholder="Contoh: Budi Santoso"
            className="w-full bg-transparent px-0 py-3 rounded-none border-b border-border/30 focus:border-foreground focus:outline-none focus:ring-0 text-base md:text-lg font-light transition-colors placeholder:text-muted-foreground/30"
          />
          {form.formState.errors.customerName && <p className="text-xs text-destructive mt-1">{form.formState.errors.customerName.message}</p>}
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Nomor WhatsApp</label>
          <input
            type="tel"
            {...form.register("customerPhone")}
            placeholder="Contoh: 08123456789"
            className="w-full bg-transparent px-0 py-3 rounded-none border-b border-border/30 focus:border-foreground focus:outline-none focus:ring-0 text-base md:text-lg font-light transition-colors placeholder:text-muted-foreground/30"
          />
          {form.formState.errors.customerPhone && <p className="text-xs text-destructive mt-1">{form.formState.errors.customerPhone.message}</p>}
        </div>

        <div className="space-y-4 pt-6 border-t border-border/10">
          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground block mb-4">Pilih Cabang</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loadingBranches ? (
              <>
                <div className="border-b-2 border-border/20 bg-muted/5 h-[104px] animate-pulse"></div>
                <div className="border-b-2 border-border/20 bg-muted/5 h-[104px] animate-pulse hidden sm:block"></div>
              </>
            ) : branches.map(branch => (
              <div
                key={branch.id}
                className={`p-6 pb-5 cursor-pointer transition-all border-b flex flex-col justify-center items-start text-left group ${selectedBranchId === branch.id ? 'border-primary' : 'border-border/20 bg-transparent hover:border-primary/50'}`}
                onClick={() => form.setValue("branchId", branch.id, { shouldValidate: true })}
              >
                <div className={`font-light text-lg mb-1 tracking-wide transition-all ${selectedBranchId === branch.id ? 'text-primary font-normal' : 'text-foreground group-hover:text-primary'}`}>{branch.name}</div>
                <div className="text-xs text-muted-foreground font-light line-clamp-1">{branch.address || "Lokasi"}</div>
              </div>
            ))}
          </div>
          {form.formState.errors.branchId && <p className="text-xs text-destructive">{form.formState.errors.branchId.message}</p>}
        </div>
      </div>
    </div>
  );
}
