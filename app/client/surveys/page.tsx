import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Eye, Users, Star } from "lucide-react"
import { getEnquetes } from "@/app/actions/enquetes"
import { SurveysClient } from "@/components/client/surveys-client"

export default async function SurveysPage() {
  const surveys = await getEnquetes()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Enquetes</h1>
        <p className="text-gray-600">Colete feedback dos seus clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Enquetes</p>
                <p className="text-xl font-bold">{surveys.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-xl font-bold">{surveys.filter((s) => s.status === "ativa").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Respostas</p>
                <p className="text-xl font-bold">{surveys.reduce((sum, s) => sum + (s.total_respostas || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Taxa de Resposta</p>
                <p className="text-xl font-bold">
                  {surveys.length > 0
                    ? Math.round((surveys.reduce((sum, s) => sum + (s.total_respostas || 0), 0) / surveys.length) * 10) / 10
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SurveysClient initialSurveys={surveys} />
    </div>
  )
}
