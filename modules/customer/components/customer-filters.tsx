"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

export function CustomerFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get("search")?.toString() || ""

  const [searchValue, setSearchValue] = useState(currentSearch)
  const debouncedSearchValue = useDebounce(searchValue, 500)

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset to page 1 when filters change
    params.set("page", "1")

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  // Update URL when debounced search value changes
  useEffect(() => {
    if (debouncedSearchValue !== currentSearch) {
      updateFilter("search", debouncedSearchValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue])

  // Sync external changes (like clear button) to local state
  useEffect(() => {
    setSearchValue(currentSearch)
  }, [currentSearch])

  const clearFilters = () => {
    setSearchValue("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.set("page", "1")
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center">
      <div className="relative w-full sm:w-[300px]">
        <Input
          placeholder="Cari pelanggan..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full"
        />
      </div>

      {currentSearch && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
        >
          <X className="h-4 w-4 mr-2" />
          Hapus Filter
        </Button>
      )}

      {isPending && (
        <div className="text-sm text-muted-foreground ml-auto animate-pulse">
          Memuat...
        </div>
      )}
    </div>
  )
}
