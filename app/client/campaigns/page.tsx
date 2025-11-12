import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Play, Eye, Users } from "lucide-react"
import { getCampanhas } from "@/app/actions/campanhas"
import { CampaignsClient } from "@/components/client/campaigns-client"

export default async function CampaignsPage() {
  const campaigns = await getCampanhas()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-600">Crie campanhas para exibir no portal de login</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Campanhas</p>
                <p className="text-xl font-bold">{campaigns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-xl font-bold">{campaigns.filter((c) => c.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-xl font-bold">{campaigns.reduce((sum, c) => sum + (c.views || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Conversões</p>
                <p className="text-xl font-bold">{campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CampaignsClient initialCampaigns={campaigns} />
    </div>
  )
}
