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
  PercentCircle
} from "lucide-react"

export const adminNav = [
  {
    label: "Utama",
    items: [
      {
        title: "Dasbor",
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
    ]
  },
  {
    label: "Staf & Pengguna",
    items: [
      {
        title: "Pengguna",
        url: "/users",
        icon: (<UsersIcon />),
        roles: ["Admin"],
      },
      {
        title: "Metode Pembayaran",
        url: "/settings/payment-methods",
        icon: (<Settings2Icon />),
        roles: ["Admin"],
      },
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
    ]
  }
]

export const branchNav = [
  {
    label: "Alat Cabang",
    items: [
      {
        title: "Kasir POS",
        url: "/pos",
        icon: (<StoreIcon />),
        roles: ["Admin", "Manager", "Cashier"],
        items: [],
      },
      {
        title: "Riwayat Transaksi",
        url: "/transactions",
        icon: (<TicketIcon />),
        roles: ["Admin", "Manager"],
        items: [],
      },
      {
        title: "HRIS & Penggajian",
        url: "/hris",
        icon: (<BriefcaseIcon />),
        roles: ["Admin", "Manager"],
        items: [],
      },
      {
        title: "Akuntansi",
        url: "/accounting",
        icon: (<CalculatorIcon />),
        roles: ["Admin", "Manager"],
        items: [],
      },
    ]
  }
]
