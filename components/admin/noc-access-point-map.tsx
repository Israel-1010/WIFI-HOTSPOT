import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AccessPointMarker } from "@/app/actions/noc"

interface AccessPointMapProps {
  markers: AccessPointMarker[]
}

function getMarkerPosition(index: number, marker: AccessPointMarker, total: number) {
  if (typeof marker.latitude === "number" && typeof marker.longitude === "number") {
    const top = 50 - marker.latitude * 0.6
    const left = 50 + marker.longitude * 0.6
    return {
      top: `${Math.min(88, Math.max(6, top))}%`,
      left: `${Math.min(88, Math.max(6, left))}%`,
    }
  }

  const columns = Math.max(1, Math.ceil(Math.sqrt(total)))
  const row = Math.floor(index / columns)
  const column = index % columns
  const verticalStep = columns > 1 ? 70 / (columns - 1) : 0
  const horizontalStep = columns > 1 ? 70 / (columns - 1) : 0

  const top = 15 + row * verticalStep
  const left = 15 + column * horizontalStep

  return {
    top: `${Math.min(85, top)}%`,
    left: `${Math.min(85, left)}%`,
  }
}

export function AccessPointMap({ markers }: AccessPointMapProps) {
  if (!markers.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">
          Nenhum hotspot cadastrado ainda. Cadastre pontos de acesso para visualizar o mapa.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-80 rounded-xl border bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, rgba(255,255,255,0) 60%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.2) 0, rgba(59,130,246,0) 55%)",
      }}></div>
      {markers.map((marker, index) => {
        const position = getMarkerPosition(index, marker, markers.length)
        const badgeVariant = marker.status?.toLowerCase() === "ativo" ? "default" : marker.alerts.length ? "destructive" : "secondary"

        return (
          <div
            key={marker.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 space-y-2"
            style={{ top: position.top, left: position.left }}
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs shadow-lg backdrop-blur",
                marker.alerts.length ? "border border-red-500/50" : "border border-white/20",
              )}
            >
              <span className="font-semibold">{marker.nome}</span>
              <Badge variant={badgeVariant}>{marker.status || "desconhecido"}</Badge>
            </div>
            <div className="rounded-lg bg-black/40 px-3 py-2 text-xs leading-relaxed shadow">
              <p>Conectados: {marker.usuariosConectados}</p>
              {marker.lastPing && <p>Último ping: {new Date(marker.lastPing).toLocaleTimeString()}</p>}
              {marker.alerts.length > 0 && (
                <ul className="list-inside list-disc space-y-1 text-red-200/90">
                  {marker.alerts.map((alert) => (
                    <li key={alert}>{alert}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
