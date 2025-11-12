import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export async function RecentActivity() {
  const supabase = await createClient()

  const { data: activities } = await supabase
    .from("logs_atividades")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(4)

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "connection":
        return "🟢"
      case "disconnection":
        return "🔴"
      case "voucher":
        return "🎫"
      case "error":
        return "❌"
      case "system":
        return "⚙️"
      default:
        return "📝"
    }
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000)

    if (diffInMinutes < 1) return "agora"
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Atividade Recente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="text-lg">{getActivityIcon(activity.tipo)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.mensagem || activity.usuario_nome}</p>
                  <p className="text-sm text-gray-500">
                    {activity.ip_address} • {getRelativeTime(activity.criado_em)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
