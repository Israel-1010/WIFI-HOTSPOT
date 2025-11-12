"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, Package, Settings, Shield } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/admin-geral/dashboard", icon: LayoutDashboard },
  { name: "Revendas", href: "/admin-geral/revendas", icon: Building2 },
  { name: "Planos", href: "/admin-geral/planos", icon: Package },
  { name: "OAuth Providers", href: "/admin-geral/oauth", icon: Shield },
  { name: "Configurações", href: "/admin-geral/settings", icon: Settings },
]

export function AdminGeralSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Admin Geral</h2>
        <p className="text-sm text-muted-foreground">Sistema Multi-tenant</p>
      </div>
      <nav className="space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
