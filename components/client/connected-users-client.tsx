"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Users } from "lucide-react"
import { FaGoogle, FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa"

interface Usuario {
  id: string
  provider: string
  nome_completo: string
  email: string
  foto_perfil: string | null
  primeira_conexao: string
  ultima_conexao: string
  total_conexoes: number
}

interface Props {
  initialUsuarios: Usuario[]
  stats: {
    total: number
    hoje: number
    semana: number
    mes: number
    porProvider: Record<string, number>
  }
}

export function ConnectedUsersClient({ initialUsuarios, stats }: Props) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsuarios = initialUsuarios.filter(
    (u) =>
      u.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.provider?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return <FaGoogle className="h-5 w-5 text-red-500" />
      case "facebook":
        return <FaFacebook className="h-5 w-5 text-blue-600" />
      case "instagram":
        return <FaInstagram className="h-5 w-5 text-pink-500" />
      case "whatsapp":
        return <FaWhatsapp className="h-5 w-5 text-green-500" />
      default:
        return <Users className="h-5 w-5 text-gray-500" />
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return "bg-red-100 text-red-700"
      case "facebook":
        return "bg-blue-100 text-blue-700"
      case "instagram":
        return "bg-pink-100 text-pink-700"
      case "whatsapp":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas por Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Autenticações por Rede Social</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.porProvider).map(([provider, count]) => (
              <div key={provider} className="flex items-center space-x-3 p-3 border rounded-lg">
                {getProviderIcon(provider)}
                <div>
                  <p className="text-sm text-gray-600 capitalize">{provider}</p>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, email ou rede social..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Usuários Autenticados ({filteredUsuarios.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsuarios.length > 0 ? (
            <div className="space-y-4">
              {filteredUsuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      {usuario.foto_perfil ? (
                        <AvatarImage src={usuario.foto_perfil || "/placeholder.svg"} alt={usuario.nome_completo} />
                      ) : (
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {usuario.nome_completo
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg">{usuario.nome_completo || "Sem nome"}</h4>
                        <Badge className={getProviderColor(usuario.provider)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getProviderIcon(usuario.provider)}
                            <span className="capitalize">{usuario.provider}</span>
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{usuario.email || "Sem email"}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>Primeira conexão: {formatDate(usuario.primeira_conexao)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600">Última conexão</div>
                    <div className="font-medium">{formatDate(usuario.ultima_conexao)}</div>
                    <div className="text-xs text-gray-500 mt-1">{usuario.total_conexoes} conexões</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário autenticado ainda"}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Tente ajustar os termos de busca"
                  : "Os usuários que se autenticarem via redes sociais aparecerão aqui"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
