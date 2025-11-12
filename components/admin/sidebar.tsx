"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  BarChart3,
  Megaphone,
  Settings,
  Wifi,
  Home,
  Palette,
  Building2,
  DollarSign,
  UserCog,
  FileText,
  Plug,
  HeadphonesIcon,
  BookTemplate,
  Briefcase,
  Menu,
  X,
} from "lucide-react"
import { useWhiteLabel } from "@/contexts/white-label-context"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Clientes", href: "/admin/clientes", icon: Building2 },
  { name: "Hotspots", href: "/admin/hotspots", icon: Wifi },
  { name: "Operações / NOC", href: "/admin/operacoes", icon: Activity },
  { name: "Financeiro", href: "/admin/financeiro", icon: DollarSign },
  { name: "Equipe", href: "/admin/equipe", icon: UserCog },
  { name: "Relatórios", href: "/admin/relatorios", icon: FileText },
  { name: "Campanhas", href: "/admin/campaigns", icon: Megaphone },
  { name: "Templates", href: "/admin/templates", icon: BookTemplate },
  { name: "Integrações", href: "/admin/integracoes", icon: Plug },
  { name: "Suporte", href: "/admin/suporte", icon: HeadphonesIcon },
  { name: "Comercial", href: "/admin/comercial", icon: Briefcase },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "White Label", href: "/admin/white-label", icon: Palette },
  { name: "Configurações", href: "/admin/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { config } = useWhiteLabel()
  const [isOpen, setIsOpen] = useState(false)

  const corSidebar = config?.cor_sidebar || "#ffffff"
  const corPrimaria = config?.cor_primaria || "#3b82f6"
  const corSecundaria = config?.cor_secundaria || "#1e40af"

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <div
        className={cn(
          "flex flex-col w-64 shadow-lg transition-transform duration-300 z-40",
          "fixed md:relative h-full",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        style={{ backgroundColor: corSidebar }}
      >
        <div className="flex items-center justify-center h-16 px-4" style={{ backgroundColor: corPrimaria }}>
          <div className="flex items-center space-x-2">
            {config?.logo_url ? (
              <img src={config.logo_url || "/placeholder.svg"} alt={config.nome} className="h-8 object-contain" />
            ) : (
              <>
                <Wifi className="h-8 w-8 text-white" />
                <span className="text-xl font-bold text-white">{config?.nome || "Hotspot360"}</span>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-white border-r-2"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: corPrimaria,
                        borderRightColor: corSecundaria,
                      }
                    : {}
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
