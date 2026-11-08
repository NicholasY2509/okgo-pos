"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const ROUTE_LABELS: Record<string, string> = {
  branches: "Cabang",
  products: "Produk & Layanan",
  promotions: "Promosi & Diskon",
  vouchers: "Voucher",
  issued: "Voucher Terbit",
  rooms: "Ruang",
  customers: "Pelanggan",
  bookings: "Booking",
  marketing: "Marketing",
  "brand-settings": "Pengaturan Brand",
  whatsapp: "Integrasi WhatsApp",
  staff: "Staf",
  onboard: "Onboard Staf",
  "work-positions": "Posisi Pekerjaan",
  users: "Pengguna",
  roles: "Role",
  attendance: "Kehadiran",
  data: "Data Kehadiran",
  statuses: "Master Status",
  "working-hours": "Master Jam Kerja",
  schedules: "Jadwal Shift",
  "attendance-log": "Log Mesin Absensi",
  machines: "Mesin Absensi",
  payroll: "Penggajian",
  components: "Komponen Gaji",
  salaries: "Gaji Pokok",
  incentives: "Insentif",
  accounting: "Akuntansi",
  journal: "Jurnal",
  coa: "Bagan Akun (COA)",
  expenses: "Pengeluaran",
  reports: "Laporan",
  create: "Tambah Baru",
  "payment-methods": "Metode Pembayaran",
  transactions: "Riwayat Transaksi",
}

export function AdminBreadcrumb() {
  const pathname = usePathname() || "/"

  // Normalize path by stripping /admin prefix for segment parsing
  const cleanPath = pathname.replace(/^\/admin/, "")
  const rawSegments = cleanPath.split("/").filter(Boolean)

  const isRoot = rawSegments.length === 0
  const rootHref = pathname.startsWith("/admin") ? "/admin" : "/"

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage className="font-semibold text-foreground">
              Dashboard
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href={rootHref}>Admin</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {rawSegments.map((segment, index) => {
          const isLast = index === rawSegments.length - 1
          const hrefPrefix = pathname.startsWith("/admin") ? "/admin" : ""
          const segmentPath = `${hrefPrefix}/${rawSegments.slice(0, index + 1).join("/")}`

          let label = ROUTE_LABELS[segment]
          if (!label) {
            // Check if segment is month format e.g. 2026-06
            if (/^\d{4}-\d{2}$/.test(segment)) {
              label = `Periode ${segment}`
            } else if (segment.length > 15) {
              label = "Detail"
            } else {
              label = segment.charAt(0).toUpperCase() + segment.slice(1)
            }
          }

          return (
            <React.Fragment key={segmentPath}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-medium text-foreground">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segmentPath}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
