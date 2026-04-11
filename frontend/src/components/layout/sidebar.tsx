"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Users,
  Warehouse,
  Truck,
  ShoppingCart,
  FileText,
  BarChart,
  Settings,
  LogOut,
  Menu,
  Bot,
  RefreshCw,
  Handshake,
  Cpu,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"

interface SidebarProps {
  className?: string
  role?: string
}

const commonRoutes = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
]

const adminRoutes = [
  {
    title: "Admin Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Products",
    href: "/dashboard/admin/products",
    icon: Package,
  },
  {
    title: "Warehouses",
    href: "/dashboard/admin/warehouses",
    icon: Warehouse,
  },
  {
    title: "Suppliers",
    href: "/dashboard/admin/suppliers",
    icon: Truck,
  },
  {
    title: "Analytics",
    href: "/dashboard/admin/analytics",
    icon: BarChart,
  },
  {
    title: "Agent Hub",
    href: "/dashboard/dev-tools/agent-hub",
    icon: Cpu,
  },
  {
    title: "Negotiations",
    href: "/dashboard/dev-tools/negotiations",
    icon: Handshake,
  },
  {
    title: "Agent Monitor",
    href: "/dashboard/dev-tools/agent-monitor",
    icon: Bot,
  },
]

const warehouseRoutes = [
  {
    title: "Warehouse Overview",
    href: "/dashboard/warehouse",
    icon: LayoutDashboard,
  },
  {
    title: "Inventory",
    href: "/dashboard/warehouse/inventory",
    icon: Package,
  },
  {
    title: "Receiving",
    href: "/dashboard/warehouse/receiving",
    icon: Truck,
  },
  {
    title: "Transfers",
    href: "/dashboard/warehouse/transfers",
    icon: Warehouse,
  },
  {
    title: "Replenishment",
    href: "/dashboard/procurement/replenishment",
    icon: RefreshCw,
  },
  {
    title: "Agent Hub",
    href: "/dashboard/dev-tools/agent-hub",
    icon: Cpu,
  },
  {
    title: "Agent Monitor",
    href: "/dashboard/dev-tools/agent-monitor",
    icon: Bot,
  },
]

const procurementRoutes = [
  {
    title: "Procurement Overview",
    href: "/dashboard/procurement",
    icon: LayoutDashboard,
  },
  {
    title: "Purchase Orders",
    href: "/dashboard/procurement/orders",
    icon: ShoppingCart,
  },
  {
    title: "Replenishment",
    href: "/dashboard/procurement/replenishment",
    icon: RefreshCw,
  },
  {
    title: "Negotiations",
    href: "/dashboard/dev-tools/negotiations",
    icon: Handshake,
  },
  {
    title: "Cost Analysis",
    href: "/dashboard/procurement/costs",
    icon: BarChart,
  },
  {
    title: "Agent Hub",
    href: "/dashboard/dev-tools/agent-hub",
    icon: Cpu,
  },
  {
    title: "Agent Monitor",
    href: "/dashboard/dev-tools/agent-monitor",
    icon: Bot,
  },
]

const supplierRoutes = [
  {
    title: "Catalog",
    href: "/dashboard/supplier/catalog",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/dashboard/supplier/orders",
    icon: FileText,
  },
]

export function Sidebar({ className, role = "admin" }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const getRoutes = () => {
    switch (role) {
      case "admin":
        return [...commonRoutes, ...adminRoutes]
      case "warehouse_manager":
        return [...commonRoutes, ...warehouseRoutes]
      case "procurement_officer":
        return [...commonRoutes, ...procurementRoutes]
      case "supplier":
        return [...commonRoutes, ...supplierRoutes]
      default:
        return commonRoutes
    }
  }

  const routes = getRoutes()

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex h-14 items-center border-b px-6 font-bold text-xl">
        AutoStock AI
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {routes.map((route, index) => (
            <Link
              key={index}
              href={route.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === route.href
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Button variant="outline" className="w-full justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden border-r bg-muted/40 md:block h-screen sticky top-0", className)}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
