import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Download, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const { data: profiles } = await supabase
    .from("perfis")
    .select(`
      *,
      pontos_usuarios (
        pontos_totais,
        nivel
      )
    `)
    .order("criado_em", { ascending: false })

  const users =
    profiles?.map((profile) => ({
      id: profile.id,
      name: profile.nome || "Usuário",
      email: profile.email || "N/A",
      points: profile.pontos_usuarios?.[0]?.pontos_totais || 0,
      level: profile.pontos_usuarios?.[0]?.nivel || 1,
      role: profile.role || "cliente",
      createdAt: profile.criado_em,
    })) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie leads e clientes capturados</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Buscar por nome, email..." className="pl-10" />
            </div>
            <Button variant="outline">Filtros</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {user.role === "admin" ? "Administrador" : "Usuário"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Pontos</p>
                      <p className="text-xl font-bold text-blue-600">{user.points}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nível</p>
                      <p className="text-xl font-bold">{user.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cadastro</p>
                      <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
