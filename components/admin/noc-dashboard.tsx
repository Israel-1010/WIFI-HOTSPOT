import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AccessPointMap } from "@/components/admin/noc-access-point-map"
import { NocQuickTools } from "@/components/admin/noc-quick-tools"
import { NocRetentionChart } from "@/components/admin/noc-retention-chart"
import type {
  OperationsOverview,
  AccessPointMapData,
  LoginFailureInsights,
  HealthCheckInsights,
} from "@/app/actions/noc"

interface NocDashboardProps {
  overview: OperationsOverview
  map: AccessPointMapData
  login: LoginFailureInsights
  health: HealthCheckInsights
}

const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativo: { label: "Ativo", variant: "default" },
  manutencao: { label: "Manutenção", variant: "secondary" },
  offline: { label: "Offline", variant: "destructive" },
}

export function NocDashboard({ overview, map, login, health }: NocDashboardProps) {
  const retentionData = [
    { periodo: "30 dias", retorno: overview.retencao.dias30 },
    { periodo: "60 dias", retorno: overview.retencao.dias60 },
    { periodo: "90 dias", retorno: overview.retencao.dias90 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operações &amp; NOC</h1>
          <p className="text-muted-foreground">
            Telemetria em tempo real, ferramentas remotas e visão de confiabilidade dos hotspots.
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-base">
          SLA médio {overview.sla.toFixed(2)}%
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">APs Online</CardTitle>
            <CardDescription>Pontos monitorados com telemetria OK</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.online}</p>
            <p className="text-xs text-muted-foreground">de {overview.totalAps} hotspots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Clientes conectados</CardTitle>
            <CardDescription>Somatório em todos os access points</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.clientesConectados}</p>
            <p className="text-xs text-muted-foreground">Atualizado em tempo real</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertas críticos</CardTitle>
            <CardDescription>Últimas 24 horas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.incidentesCriticos}</p>
            <p className="text-xs text-muted-foreground">Falhas ou incidentes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">APs em manutenção</CardTitle>
            <CardDescription>Equipamentos com janela ativa</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.manutencao}</p>
            <p className="text-xs text-muted-foreground">Separados da contagem de offline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Mapa de APs</CardTitle>
            <CardDescription>{map.totalAlerts} alertas distribuídos nos hotspots monitorados</CardDescription>
          </CardHeader>
          <CardContent>
            <AccessPointMap markers={map.markers} />
          </CardContent>
        </Card>
        <NocQuickTools
          hotspots={overview.uptimePorSite.map((site) => ({ id: site.id, nome: site.nome, status: site.status }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Retorno de usuários</CardTitle>
            <CardDescription>Fidelidade dos visitantes por período de análise</CardDescription>
          </CardHeader>
          <CardContent>
            <NocRetentionChart data={retentionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principais falhas de login</CardTitle>
            <CardDescription>Motivos que mais bloquearam acessos recentemente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {login.topMotivos.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem falhas registradas nas últimas execuções.</p>
              )}
              {login.topMotivos.map((motivo) => (
                <Badge key={motivo.motivo} variant="secondary">
                  {motivo.motivo} · {motivo.total}
                </Badge>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">
              {login.registrosRecentes.slice(0, 5).map((registro) => (
                <div key={registro.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{registro.mensagem}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(registro.criado_em).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="mt-1 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                    {registro.mac_address && <span>MAC: {registro.mac_address}</span>}
                    {registro.hotspot_id && <span>Hotspot: {registro.hotspot_id}</span>}
                    <span>Tipo: {registro.tipo}</span>
                  </div>
                </div>
              ))}
              {login.registrosRecentes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum registro recente de falha de autenticação.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saúde dos access points</CardTitle>
          <CardDescription>
            Latência, perda de pacotes e firmware reportados pelas últimas sondagens automáticas.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4">Hotspot</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Latência</th>
                <th className="py-2 pr-4">Perda</th>
                <th className="py-2 pr-4">Firmware</th>
                <th className="py-2">Último teste</th>
              </tr>
            </thead>
            <tbody>
              {health.checks.map((check) => {
                const status = (check.status || "").toLowerCase()
                const badge = statusBadges[status] ?? statusBadges["offline"]
                return (
                  <tr key={check.hotspotId} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{check.nome}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="py-3 pr-4">{check.latencyMs ? `${check.latencyMs} ms` : "—"}</td>
                    <td className="py-3 pr-4">{check.packetLoss ? `${check.packetLoss}%` : "—"}</td>
                    <td className="py-3 pr-4">{check.firmware || "Não informado"}</td>
                    <td className="py-3">{check.lastCheck ? new Date(check.lastCheck).toLocaleString() : "—"}</td>
                  </tr>
                )
              })}
              {health.checks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    Sem dados recentes de health check. Configure as sondagens no seu controlador.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {health.firmwareOutdated > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {health.firmwareOutdated} hotspot(s) com firmware desatualizado aguardando atualização.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
