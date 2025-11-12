import { getPlanos } from "@/app/actions/admin-geral"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export default async function PlanosPage() {
  const planos = await getPlanos()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planos</h1>
        <p className="text-muted-foreground">Gerencie os planos disponíveis para as revendas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {planos.map((plano) => (
          <Card key={plano.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                {plano.ativo && <Badge variant="default">Ativo</Badge>}
              </div>
              <p className="text-3xl font-bold text-primary">
                R$ {plano.preco_mensal}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{plano.descricao}</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{plano.limite_clientes} clientes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{plano.limite_hotspots} hotspots</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>{plano.limite_usuarios_simultaneos} usuários simultâneos</span>
                </div>
              </div>

              {plano.recursos && typeof plano.recursos === "object" && (
                <div className="pt-4 border-t space-y-2">
                  {Object.entries(plano.recursos as Record<string, boolean>).map(
                    ([key, value]) =>
                      value && (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="capitalize">{key.replace(/_/g, " ")}</span>
                        </div>
                      ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
