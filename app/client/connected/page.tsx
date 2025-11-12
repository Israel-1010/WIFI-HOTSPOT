import { Card, CardContent } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, Activity } from "lucide-react"
import { getUsuariosOAuth, getEstatisticasOAuth } from "@/app/actions/usuarios-oauth"
import { ConnectedUsersClient } from "@/components/client/connected-users-client"

export default async function ConnectedUsersPage() {
  const usuarios = await getUsuariosOAuth()
  const stats = await getEstatisticasOAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Usuários Conectados</h1>
        <p className="text-gray-600">Visualize todos os usuários que se autenticaram via redes sociais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Usuários</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="text-xl font-bold">{stats.hoje}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Esta Semana</p>
                <p className="text-xl font-bold">{stats.semana}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Este Mês</p>
                <p className="text-xl font-bold">{stats.mes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConnectedUsersClient initialUsuarios={usuarios} stats={stats} />
    </div>
  )
}
