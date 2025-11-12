"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Wifi,
  Users,
  Ticket,
  Settings,
  Monitor,
  ExternalLink,
  Activity,
  Megaphone,
  ClipboardList,
  TrendingUp,
  ImageIcon,
  MousePointerClick,
  Menu,
  X,
} from "lucide-react"
import { useWhiteLabel } from "@/contexts/white-label-context"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/client/dashboard", icon: Home },
  { name: "Status Mikrotik", href: "/client/mikrotik", icon: Monitor },
  { name: "Clientes Conectados", href: "/client/connected", icon: Users },
  { name: "Marketing", href: "/client/marketing", icon: TrendingUp },
  { name: "Anúncios Wi-Fi", href: "/client/anuncios", icon: ImageIcon },
  { name: "Interações", href: "/client/interacoes", icon: MousePointerClick },
  { name: "Campanhas", href: "/client/campaigns", icon: Megaphone },
  { name: "Enquetes", href: "/client/surveys", icon: ClipboardList },
  { name: "Vouchers", href: "/client/vouchers", icon: Ticket },
  { name: "Configurar Hotspot", href: "/client/hotspot", icon: Wifi },
  { name: "Portal de Login", href: "/client/portal-preview", icon: ExternalLink },
  { name: "Logs", href: "/client/logs", icon: Activity },
  { name: "Configurações", href: "/client/settings", icon: Settings },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { config } = useWhiteLabel()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sidebarBgColor = config?.cor_sidebar || "#1e40af"
  const headerBgColor = config?.cor_header || "#3b82f6"
  const logoUrl = config?.logo_url
  const nomeSistema = config?.nome || "Meu Hotspot"

  console.log("[v0] ClientSidebar - config:", config)
  console.log("[v0] ClientSidebar - sidebarBgColor:", sidebarBgColor)
  console.log("[v0] ClientSidebar - headerBgColor:", headerBgColor)

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={cn(
          "flex flex-col w-64 shadow-lg transition-transform duration-300 ease-in-out z-40",
          "lg:translate-x-0 lg:static fixed inset-y-0 left-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ backgroundColor: sidebarBgColor }}
      >
        <div
          className="flex items-center justify-center h-20 px-4 py-3 border-b border-white/10"
          style={{ backgroundColor: headerBgColor }}
        >
          <div className="flex items-center space-x-3 w-full">
            {logoUrl ? (
              <img
                src={logoUrl || "/placeholder.svg"}
                alt={nomeSistema}
                className="h-12 w-auto max-w-full object-contain"
              />
            ) : (
              <>
                <Wifi className="h-8 w-8 text-white flex-shrink-0" />
                <span className="text-lg font-bold text-white truncate">{nomeSistema}</span>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs text-white/60 text-center truncate">{nomeSistema}</p>
        </div>
      </div>
    </>
  )
}
