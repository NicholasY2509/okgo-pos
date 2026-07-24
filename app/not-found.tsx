import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Halaman Tidak Ditemukan
        </h2>
        <p className="mt-4 text-muted-foreground">
          Maaf, halaman atau portal cabang yang Anda cari tidak dapat ditemukan. Silakan periksa kembali URL yang Anda masukkan.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            prefetch={false}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
