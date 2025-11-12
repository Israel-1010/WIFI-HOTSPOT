import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Eye, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase.from("campanhas").select("*").order("criado_em", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-gray-600">Gerencie suas campanhas de marketing</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      <div className="grid gap-6">
        {!campaigns || campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">Nenhuma campanha encontrada</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{campaign.nome}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">{campaign.tipo}</Badge>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status === "active" ? "Ativa" : "Pausada"}
                      </Badge>
                      {campaign.posicao_modal && <Badge variant="outline">Modal: {campaign.posicao_modal}</Badge>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Visualizações</p>
                    <p className="text-2xl font-bold">{(campaign.visualizacoes || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Cliques</p>
                    <p className="text-2xl font-bold">{campaign.cliques || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversões</p>
                    <p className="text-2xl font-bold">{campaign.conversoes || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Conversão</p>
                    <p className="text-2xl font-bold">
                      {campaign.visualizacoes > 0
                        ? ((campaign.conversoes / campaign.visualizacoes) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Período</p>
                    <p className="text-sm font-medium">
                      {campaign.data_inicio ? new Date(campaign.data_inicio).toLocaleDateString() : "N/A"} -{" "}
                      {campaign.data_fim ? new Date(campaign.data_fim).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
