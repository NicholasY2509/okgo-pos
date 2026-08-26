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
  Banknote,
  MonitorSmartphoneIcon,
  StarIcon,
  CircleDollarSign
} from "lucide-react"

export const branchNav = [
  {
    label: "Utama",
    items: [
      {
        title: "POS",
        url: "/pos",
        icon: (<StoreIcon />),
        roles: ["Admin", "Manager", "Kasir"],
      },
      {
        title: "Daftar Booking",
        url: "/bookings",
        icon: (<Calendar1 />),
        roles: ["Admin", "Manager", "Kasir"],
      },
      {
        title: "Riwayat Transaksi",
        url: "/transactions",
        icon: (<FileText />),
        roles: ["Admin", "Manager", "Kasir"],
      }
    ]
  },
  {
    label: "Fitur Tambahan",
    items: [
      {
        title: "Mode Kiosk",
        url: "/kiosk",
        icon: (<MonitorSmartphoneIcon />),
        roles: ["Admin", "Manager", "Kasir"],
      },
      {
        title: "Buku Ulasan",
        url: "/reviews",
        icon: (<StarIcon />),
        roles: ["Admin", "Manager"],
      },
    ]
  },
  {
    label: "Manajemen",
    items: [
      {
        title: "HRIS",
        url: "/hris",
        icon: (<UsersIcon />),
        roles: ["Admin", "Manager"],
      },
      {
        title: "Accounting",
        url: "/accounting",
        icon: (<Book />),
        roles: ["Admin", "Manager"],
      }
    ]
  }
]

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
        title: "Promo & Diskon",
        url: "/promotions",
        icon: (<PercentCircle />),
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
      {
        title: "Marketing",
        url: "/marketing",
        icon: (<PercentCircle />),
        roles: ["Admin"],
      },
      {
        title: "Pengaturan Brand",
        url: "/brand-settings",
        icon: (<Settings2Icon />),
        roles: ["Admin"],
      }
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
      {
        title: "Kehadiran",
        url: "/admin/attendance",
        icon: (<Calendar1 />),
        roles: ["Admin"],
        items: [
          {
            title: "Data Kehadiran",
            url: "/admin/attendance/data",
          },
          {
            title: "Master Status",
            url: "/admin/attendance/statuses",
          },
          {
            title: "Master Jam Kerja",
            url: "/admin/attendance/working-hours",
          },
          {
            title: "Jadwal Shift",
            url: "/admin/attendance/schedules",
          },
          {
            title: "Log Mesin Absensi",
            url: "/admin/attendance-log",
          },
          {
            title: "Mesin Absensi",
            url: "/admin/attendance/machines",
          }
        ]
      },
    ]
  },
  {
    label: "Gaji & Insentif",
    items: [
      {
        title: "Penggajian",
        url: "/payroll",
        icon: (<CalculatorIcon />),
        roles: ["Admin"],
      },
      {
        title: "Gaji Pokok",
        url: "/salaries",
        icon: (<CircleDollarSign />),
        roles: ["Admin"],
      },
      {
        title: "Komponen Gaji",
        url: "/admin/payroll/components",
        icon: (<CalculatorIcon />),
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
        title: "Pengeluaran",
        url: "/accounting/expenses",
        icon: (<FileText />), // Assuming FileText for expenses, could also be receipt or something
        roles: ["Admin"],
      },
      {
        title: "Riwayat Transaksi",
        url: "/transactions",
        icon: (<FileText />),
        roles: ["Admin"],
      },
      {
        title: "Laporan",
        url: "/accounting/reports",
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
