"use client";

import { useState, useMemo } from "react";
import { Sparkles, PackageOpen, Image as ImageIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ServiceListProps {
  products: any[];
  onProductClick: (product: any) => void;
}

export function ServiceList({ products, onProductClick }: ServiceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category?.name) {
        cats.add(p.category.name);
      }
    });
    return ["ALL", ...Array.from(cats)];
  }, [products]);

  // Filter products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || (p.category?.name === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="mb-10">
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat === "ALL" ? "Semua" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
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
              <div>
                <h4 className="font-semibold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {p.name}
                </h4>
                {p.category?.name && (
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                    {p.category.name}
                  </p>
                )}
              </div>
              <p className="text-primary font-bold mt-2">
                Rp {Number(p.price).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border rounded-xl bg-muted/50">
            <PackageOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Tidak ada layanan yang ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
