import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Star, Gift, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GamificationPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch gamification missions
  const { data: missions } = await supabase.from("gamificacao").select("*").order("criado_em", { ascending: false })

  // Fetch vouchers as rewards
  const { data: rewards } = await supabase.from("vouchers").select("*").order("criado_em", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gamificação</h1>
          <p className="text-gray-600">Gerencie missões, pontos e recompensas</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Gift className="h-4 w-4 mr-2" />
            Nova Recompensa
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Missão
          </Button>
        </div>
      </div>

      {/* Missões */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Trophy className="h-5 w-5 mr-2" />
          Missões
        </h2>
        <div className="grid gap-4">
          {missions && missions.length > 0 ? (
            missions.map((mission) => (
              <Card key={mission.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{mission.name}</h3>
                        <Badge variant={mission.is_active ? "default" : "secondary"}>
                          {mission.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">{mission.type}</Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{mission.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1" />
                          {typeof mission.rewards === "object" &&
                          mission.rewards !== null &&
                          "points" in mission.rewards
                            ? (mission.rewards as { points?: number }).points
                            : 0}{" "}
                          pontos
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Nenhuma missão encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recompensas */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Gift className="h-5 w-5 mr-2" />
          Recompensas
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards && rewards.length > 0 ? (
            rewards.map((reward) => (
              <Card key={reward.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{reward.title}</h3>
                    <Badge variant={reward.is_active ? "default" : "secondary"}>
                      {reward.is_active ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{reward.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-600">
                      {reward.discount_value} {reward.discount_type === "percentage" ? "%" : "R$"}
                    </span>
                    <span className="text-gray-500">{reward.used_count} resgates</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">Nenhuma recompensa encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
