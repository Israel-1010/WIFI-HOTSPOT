"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import type { User as UserType } from "@/lib/auth"

interface AdminGeralHeaderProps {
  user: UserType
}

export function AdminGeralHeader({ user }: AdminGeralHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold">Painel Administrativo</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-right">
            <div className="font-medium">{user.nome_completo}</div>
            <div className="text-muted-foreground text-xs">Administrador Geral</div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
