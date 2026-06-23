import { Sparkles, PackageOpen, Image as ImageIcon } from "lucide-react";

interface ServiceListProps {
  products: any[];
  onProductClick: (product: any) => void;
}

export function ServiceList({ products, onProductClick }: ServiceListProps) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-foreground">Layanan</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => onProductClick(p)}
            className="group relative flex flex-col bg-card border border-border rounded-xl p-3 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/50 hover:ring-1 hover:ring-primary/20"
          >
            <div className="bg-muted aspect-video mb-3 rounded-lg flex items-center justify-center text-muted-foreground transition-colors">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ImageIcon className="w-8 h-8 opacity-50 group-hover:text-primary transition-colors" />
              )}
            </div>
            <div className="flex flex-col flex-1 justify-between">
              <h4 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {p.name}
              </h4>
              <p className="text-primary font-bold mt-2">
                Rp {Number(p.price).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
            <PackageOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada layanan tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
