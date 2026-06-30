import * as React from "react"
import {
  BuildingIcon,
  Settings2Icon,
  UsersIcon,
  CalculatorIcon,
  LayoutDashboardIcon,
  StoreIcon,
  BriefcaseIcon,
  ContactIcon,
  TicketIcon,
  ArmchairIcon,
  PercentCircle,
  FileText,
  Calendar1,
  KeyIcon,
  Book,
  Users2,
  Banknote
} from "lucide-react"

export const adminNav = [
  {
    label: "Utama",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: (<LayoutDashboardIcon />),
        roles: ["Admin"],
      },
      {
        title: "Cabang",
        url: "/branches",
        icon: (<BuildingIcon />),
        roles: ["Admin"],
      },
      {
        title: "Produk & Layanan",
        url: "/products",
        icon: (<StoreIcon />),
        roles: ["Admin"],
      },

      {
        title: "Voucher",
        url: "/vouchers",
        icon: (<TicketIcon />),
        roles: ["Admin"],
        items: [
          {
            title: "Paket Voucher",
            url: "/vouchers",
          },
          {
            title: "Voucher Terbit",
            url: "/vouchers/issued",
          }
        ]
      },
      {
        title: "Ruang",
        url: "/rooms",
        icon: (<ArmchairIcon />),
        roles: ["Admin"],
      },
      {
        title: "Pelanggan",
        url: "/customers",
        icon: (<UsersIcon />),
        roles: ["Admin"],
      },
      {
        title: "Booking",
        url: "/bookings",
        icon: (<Calendar1 />),
        roles: ["Admin", "Manager"],
      },
    ]
  },
  {
    label: "Staf & Pengguna",
    items: [

      {
        title: "Staf",
        url: "/staff",
        icon: (<ContactIcon />),
        roles: ["Admin"],
      },
      {
        title: "Posisi Kerja",
        url: "/work-positions",
        icon: (<BriefcaseIcon />),
        roles: ["Admin"],
      },
      {
        title: "User",
        url: "/users",
        icon: (<UsersIcon />),
        roles: ["Admin"],
      },
      {
        title: "Role",
        url: "/roles",
        icon: (<KeyIcon />),
        roles: ["Admin"],
      },
    ]
  },
  {
    label: "Akuntansi",
    items: [
      {
        title: "Jurnal",
        url: "/accounting/journal",
        icon: (<Book />),
        roles: ["Admin"],
      },
      {
        title: "Chart of Account (COA)",
        url: "/accounting/coa",
        icon: (<Banknote />),
        roles: ["Admin"],
      },
      {
        title: "Riwayat Transaksi",
        url: "/accounting/transactions",
        icon: (<FileText />),
        roles: ["Admin"],
      },
      {
        title: "Laporan",
        url: "/accounting/report",
        icon: (<FileText />),
        roles: ["Admin"],
      },
      {
        title: "Metode Pembayaran",
        url: "/payment-methods",
        icon: (<Settings2Icon />),
        roles: ["Admin"],
      },
    ]
  },

]
