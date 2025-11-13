import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wifi, Users, TrendingUp, Target } from "lucide-react"
import { MetricsChart } from "@/components/admin/metrics-chart"
import { RecentActivity } from "@/components/admin/recent-activity"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: logsData } = await supabase
    .from("logs_atividades")
    .select("*")
    .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { data: campaignsData } = await supabase.from("campanhas").select("*").eq("status", "ativa")

  const connectionsToday = logsData?.filter((l) => l.tipo === "connection").length || 0
  const leadsCount = logsData?.filter((l) => l.acao === "lead_captured").length || 0
  const activeCampaigns = campaignsData?.length || 0
  const conversionRate = connectionsToday > 0 ? ((leadsCount / connectionsToday) * 100).toFixed(1) : "0.0"

  const stats = [
    {
      title: "Conexões Hoje",
      value: connectionsToday.toString(),
      change: "+12%",
      icon: Wifi,
      color: "text-blue-600",
    },
    {
      title: "Leads Capturados",
      value: leadsCount.toString(),
      change: "+8%",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Taxa de Conversão",
      value: `${conversionRate}%`,
      change: "+5%",
      icon: TrendingUp,
      color: "text-purple-600",
    },
    {
      title: "Campanhas Ativas",
      value: activeCampaigns.toString(),
      change: "+2",
      icon: Target,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu sistema de marketing</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change} vs ontem</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conexões por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
