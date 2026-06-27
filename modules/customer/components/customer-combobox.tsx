"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { searchCustomersAction } from "../actions/customer-action";
import { useDebounce } from "@/hooks/use-debounce"; // check if this exists, if not we will create it or use inline

interface CustomerComboboxProps {
  selectedCustomerId?: string;
  onSelectCustomer: (customerId: string | undefined) => void;
  // Passing initial customers in case we have pre-fetched data (optional)
  initialCustomers?: any[];
}

export function CustomerCombobox({ selectedCustomerId, onSelectCustomer, initialCustomers = [] }: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Simple debounce inline if hook is missing
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadCustomers = useCallback(async (query: string, pageNum: number, isNewSearch: boolean = false) => {
    setLoading(true);
    const result = await searchCustomersAction(query, pageNum, 20);
    
    if (result.success && result.data && result.metadata) {
      if (isNewSearch) {
        setCustomers(result.data);
      } else {
        setCustomers(prev => [...prev, ...result.data]);
      }
      setHasMore(result.metadata.hasMore);
    }
    setLoading(false);
  }, []);

  // Fetch when debounced search changes
  useEffect(() => {
    setPage(1);
    loadCustomers(debouncedSearch, 1, true);
  }, [debouncedSearch, loadCustomers]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 50) {
      if (hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadCustomers(debouncedSearch, nextPage, false);
      }
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  
  // If we have a selected ID but the customer is not in the list (e.g. from initial load without full list), 
  // we might want to display a fallback or fetch it, but usually the parent passes it or it's just 'Selected'
  const displayValue = selectedCustomer 
    ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`
    : "Cari pelanggan...";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ketik nama atau nomor telepon..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-y-auto">
            {loading && page === 1 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Mencari...
              </div>
            )}
            
            {!loading && customers.length === 0 && (
              <CommandEmpty>Pelanggan tidak ditemukan.</CommandEmpty>
            )}

            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => {
                    onSelectCustomer(c.id === selectedCustomerId ? undefined : c.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCustomerId === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {c.name} {c.phone ? `(${c.phone})` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {loading && page > 1 && (
              <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Memuat lebih...
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
