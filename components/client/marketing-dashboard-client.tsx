"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Facebook, Mail, Linkedin, Youtube } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FaReddit, FaGoogle } from "react-icons/fa"
import { SiX } from "react-icons/si"

interface MarketingStats {
  conexoesSociais: {
    facebook: number
    google: number
    linkedin: number
    twitter: number
    email: number
    youtube: number
    reddit: number
  }
  usuariosOnlineAgora: number
  ultimasConexoes: any[]
  demograficos: {
    faixaEtaria: Array<{ name: string; value: number; fill: string }>
    genero: Array<{ name: string; value: number; fill: string }>
  }
}

export function MarketingDashboardClient({ initialStats }: { initialStats: MarketingStats }) {
  const socialNetworks = [
    { name: "Facebook", icon: Facebook, color: "bg-[#3b5998]", count: initialStats.conexoesSociais.facebook },
    { name: "Google", icon: FaGoogle, color: "bg-[#ea4335]", count: initialStats.conexoesSociais.google },
    { name: "LinkedIn", icon: Linkedin, color: "bg-[#0077b5]", count: initialStats.conexoesSociais.linkedin },
    { name: "X", icon: SiX, color: "bg-black", count: initialStats.conexoesSociais.twitter },
    { name: "Email", icon: Mail, color: "bg-[#c4d82e]", count: initialStats.conexoesSociais.email },
    { name: "YouTube", icon: Youtube, color: "bg-[#ff6600]", count: initialStats.conexoesSociais.youtube },
    { name: "Reddit", icon: FaReddit, color: "bg-[#ff4500]", count: initialStats.conexoesSociais.reddit },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketing</h1>
        <p className="text-gray-600">Análise de conexões e engajamento</p>
      </div>

      {/* Conexões Hoje */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Conexões Hoje</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {socialNetworks.map((network) => {
            const IconComponent = network.icon
            return (
              <Card key={network.name} className={`${network.color} text-white`}>
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                  <IconComponent className="h-8 w-8" />
                  <span className="text-3xl font-bold">{network.count}</span>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Tabela de Usuários Online */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Online por Página</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Tempo online</th>
                  <th className="text-left p-3">Consumo</th>
                  <th className="text-left p-3">Visitas</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center p-6 text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Últimas Conexões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faixa Etária */}
        <Card>
          <CardHeader>
            <CardTitle>FAIXA ETÁRIA</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={initialStats.demograficos.faixaEtaria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {initialStats.demograficos.faixaEtaria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gênero */}
        <Card>
          <CardHeader>
            <CardTitle>GÊNERO</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={initialStats.demograficos.genero}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {initialStats.demograficos.genero.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Últimas Conexões */}
        <Card>
          <CardHeader>
            <CardTitle>ÚLTIMAS CONEXÕES</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialStats.ultimasConexoes.length > 0 ? (
                initialStats.ultimasConexoes.map((conexao, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{conexao.usuario_nome?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{conexao.usuario_nome || "Usuário"}</p>
                      <p className="text-sm text-gray-500">{new Date(conexao.criado_em).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">Nenhuma conexão recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferências de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle>SEUS CLIENTES PREFEREM SE CONECTAR COM:</CardTitle>
          <p className="text-sm text-gray-600">
            Analise essa métrica e crie ações de marketing direcionadas para a rede social que mais utilizam.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Tipo de conexão</p>
              <p className="text-gray-500">-</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Mês atual</p>
              <p className="text-gray-500">-</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Ano atual</p>
              <p className="text-gray-500">-</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usuários Online Agora */}
      <div className="fixed bottom-6 right-6">
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-gray-900">{initialStats.usuariosOnlineAgora}</p>
            <p className="text-sm text-gray-600">Usuários online agora</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
