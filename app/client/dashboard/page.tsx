import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wifi, Users, Activity, Clock, Plus, ExternalLink } from "lucide-react"
import { MikrotikStatus } from "@/components/client/mikrotik-status"
import { ConnectedUsers } from "@/components/client/connected-users"
import { RecentActivity } from "@/components/client/recent-activity"
import Link from "next/link"
import { getDashboardStats } from "@/app/actions/dashboard"

export default async function ClientDashboardPage() {
  const stats = await getDashboardStats()

  const statsCards = [
    {
      title: "Clientes Conectados",
      value: "23",
      change: "+5 desde ontem",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Vouchers Ativos",
      value: stats.activeVouchersCount.toString(),
      change: `${stats.todayConnections} utilizados hoje`,
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "Tempo Médio Online",
      value: "45min",
      change: "+12% vs ontem",
      icon: Clock,
      color: "text-purple-600",
    },
    {
      title: "Status Mikrotik",
      value: "Online",
      change: "Uptime: 15 dias",
      icon: Wifi,
      color: "text-green-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Gerencie seu hotspot Wi-Fi</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/client/vouchers">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Voucher
            </Button>
          </Link>
          <Link href="/hotspot/login" target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Portal
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MikrotikStatus />
          <ConnectedUsers />
        </div>
        <div>
          <RecentActivity activities={stats.recentActivity} />
        </div>
      </div>
    </div>
  )
}
