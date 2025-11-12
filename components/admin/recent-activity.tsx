import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const activities = [
  {
    id: 1,
    user: "João Silva",
    action: "conectou-se ao Wi-Fi",
    time: "2 min atrás",
    location: "Loja Centro",
  },
  {
    id: 2,
    user: "Maria Santos",
    action: "completou campanha",
    time: "5 min atrás",
    location: "Loja Shopping",
  },
  {
    id: 3,
    user: "Pedro Costa",
    action: "ganhou 50 pontos",
    time: "8 min atrás",
    location: "Loja Norte",
  },
  {
    id: 4,
    user: "Ana Lima",
    action: "resgatou cupom",
    time: "12 min atrás",
    location: "Loja Centro",
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {activity.user
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.user}</p>
            <p className="text-sm text-gray-500">
              {activity.action} • {activity.location}
            </p>
          </div>
          <div className="text-xs text-gray-400">{activity.time}</div>
        </div>
      ))}
    </div>
  )
}
