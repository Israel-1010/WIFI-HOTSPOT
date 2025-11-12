"use client"

import { Bell, Search, User, LogOut, Settings, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"
import { useWhiteLabel } from "@/contexts/white-label-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

interface HeaderProps {
  user: UserType
  onMenuClick?: () => void
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { config } = useWhiteLabel()
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  const headerStyle = {
    backgroundColor: "var(--color-header)",
  }

  const userInitials =
    user.nome_completo
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"

  return (
    <header className="sticky top-0 z-40 shadow-sm border-b border-white/10 backdrop-blur-sm" style={headerStyle}>
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>

          {config?.logo_url && (
            <div className="hidden md:flex items-center gap-3">
              <img
                src={config.logo_url || "/placeholder.svg"}
                alt={config.nome || "Logo"}
                className="h-10 w-auto max-w-[120px] object-contain"
              />
              <div className="h-8 w-px bg-white/20" />
            </div>
          )}

          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
            <Input
              placeholder="Buscar clientes, hotspots, faturas..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="sm:hidden text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>

          <ThemeToggle />

          <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="font-medium text-sm">Novo cliente cadastrado</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Shopping X foi adicionado há 5 minutos</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="font-medium text-sm">Pagamento recebido</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Fatura #1234 paga - R$ 299,00</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <div className="flex items-center gap-2 w-full">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <span className="font-medium text-sm">Hotspot offline</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Shopping Center - Verificar conexão</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary">Ver todas notificações</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-white hover:bg-white/10 h-auto py-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.email || "/placeholder.svg"} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">{user.nome_completo}</span>
                  <span className="text-xs text-white/70 leading-none mt-1">
                    {user.role === "admin_revenda" ? "Admin Revenda" : "Admin"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/perfil")}>
                <User className="h-4 w-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
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
