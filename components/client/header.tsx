"use client"

import { Bell, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"
import { useWhiteLabel } from "@/contexts/white-label-context"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/theme-toggle"

interface ClientHeaderProps {
  user: UserType
}

export function ClientHeader({ user }: ClientHeaderProps) {
  const router = useRouter()
  const { config } = useWhiteLabel()
  const { theme } = useTheme()

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  const headerStyle = {
    backgroundColor: "var(--color-header)",
  }

  return (
    <header className="shadow-sm border-b border-white/10" style={headerStyle}>
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="lg:hidden flex items-center space-x-2">
            {config?.logo_url && (
              <img
                src={config.logo_url || "/placeholder.svg"}
                alt={config.nome}
                className="h-8 w-auto object-contain"
              />
            )}
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">Mikrotik Online</span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              192.168.1.1
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:block text-sm text-right">
            <div className="font-medium text-white">{user.nome_completo}</div>
            <div className="text-white/70 text-xs">{user.role === "cliente" ? "Cliente" : "Usuário"}</div>
          </div>

          <div className="hidden md:block text-sm text-white/90">
            <span className="font-medium">23</span> clientes conectados
          </div>

          <ThemeToggle />

          <Button variant="ghost" size="icon" className="hidden md:flex text-white hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
