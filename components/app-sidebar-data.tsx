import * as React from "react"
import {
  BuildingIcon,
  Settings2Icon,
  UsersIcon,
  CalculatorIcon,
  LayoutDashboardIcon,
  StoreIcon,
  BriefcaseIcon,
  ContactIcon
} from "lucide-react"

export const adminNav = [
  {
    label: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: (<LayoutDashboardIcon />),
        roles: ["Admin"],
      },
      {
        title: "Branches",
        url: "/branches",
        icon: (<BuildingIcon />),
        roles: ["Admin"],
      },
      {
        title: "Products & Services",
        url: "/products",
        icon: (<StoreIcon />),
        roles: ["Admin"],
      },
    ]
  },
  {
    label: "Staff & Users",
    items: [
      {
        title: "Users",
        url: "/users",
        icon: (<UsersIcon />),
        roles: ["Admin"],
      },
      // {
      //   title: "Settings",
      //   url: "/settings",
      //   icon: (<Settings2Icon />),
      //   roles: ["Admin"],
      // },
      {
        title: "Staff",
        url: "/staff",
        icon: (<ContactIcon />),
        roles: ["Admin"],
      },

      {
        title: "Work Positions",
        url: "/work-positions",
        icon: (<BriefcaseIcon />),
        roles: ["Admin"],
      },
    ]
  }
]

export const branchNav = [
  {
    label: "Branch Tools",
    items: [
      {
        title: "POS Terminal",
        url: "/pos",
        icon: (<StoreIcon />),
        roles: ["Admin", "Manager", "Cashier"],
        items: [],
      },
      {
        title: "HRIS & Payroll",
        url: "/hris",
        icon: (<BriefcaseIcon />),
        roles: ["Admin", "Manager"],
        items: [],
      },
      {
        title: "Accounting",
        url: "/accounting",
        icon: (<CalculatorIcon />),
        roles: ["Admin", "Manager"],
        items: [],
      },
    ]
  }
]
