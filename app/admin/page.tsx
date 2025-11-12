import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Wifi, Activity, TrendingUp } from "lucide-react"
import { getRevendaStats, getClientesComAcessos } from "@/app/actions/revenda-stats"

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const [stats, clientesComAcessos] = await Promise.all([getRevendaStats(), getClientesComAcessos()])

  if (!stats) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard da Revenda</h1>
        <p className="text-muted-foreground">Visão geral dos seus clientes e acessos</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Hotspots</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHotspots}</div>
            <p className="text-xs text-muted-foreground">Pontos de acesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acessos Hoje</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acessosHoje}</div>
            <p className="text-xs text-muted-foreground">Conexões realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuariosOnline}</div>
            <p className="text-xs text-muted-foreground">Conectados agora</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de clientes com acessos */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes e Acessos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Plano</th>
                  <th className="text-right p-2">Hotspots</th>
                  <th className="text-right p-2">Acessos Hoje</th>
                  <th className="text-right p-2">Total Acessos</th>
                </tr>
              </thead>
              <tbody>
                {clientesComAcessos.map((cliente) => (
                  <tr key={cliente.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{cliente.nome_completo}</td>
                    <td className="p-2">{cliente.empresa}</td>
                    <td className="p-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{cliente.plano}</span>
                    </td>
                    <td className="text-right p-2">{cliente.totalHotspots}</td>
                    <td className="text-right p-2 font-medium">{cliente.acessosHoje}</td>
                    <td className="text-right p-2">{cliente.totalAcessos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientesComAcessos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado ainda</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
