"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { kickClientFromHotspot, bounceHotspotSsid, triggerCaptivePortal } from "@/app/actions/noc-tools"
import { useToastFeedback } from "@/hooks/use-toast-feedback"
import { Loader2, WifiOff, Radar, Sparkles } from "lucide-react"

interface HotspotOption {
  id: string
  nome: string
  status: string | null
}

interface QuickToolsProps {
  hotspots: HotspotOption[]
}

export function NocQuickTools({ hotspots }: QuickToolsProps) {
  const feedback = useToastFeedback()
  const [selectedHotspot, setSelectedHotspot] = useState<string>(hotspots[0]?.id || "")
  const [clientId, setClientId] = useState("")
  const [ssid, setSsid] = useState("")
  const [target, setTarget] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleKick = () => {
    if (!selectedHotspot || !clientId.trim()) {
      feedback.error("Selecione o hotspot e informe o identificador do cliente")
      return
    }

    startTransition(async () => {
      const result = await kickClientFromHotspot({ hotspotId: selectedHotspot, clientIdentifier: clientId.trim() })
      if (result.success) {
        feedback.success(result.message)
        setClientId("")
      } else {
        feedback.error(result.message)
      }
    })
  }

  const handleBounce = () => {
    if (!selectedHotspot) {
      feedback.error("Selecione um hotspot para reiniciar a rede")
      return
    }

    startTransition(async () => {
      const result = await bounceHotspotSsid({ hotspotId: selectedHotspot, ssid: ssid.trim() || undefined })
      if (result.success) {
        feedback.success(result.message)
        setSsid("")
      } else {
        feedback.error(result.message)
      }
    })
  }

  const handleTrigger = () => {
    if (!selectedHotspot) {
      feedback.error("Selecione um hotspot para reprovocar o portal")
      return
    }

    startTransition(async () => {
      const result = await triggerCaptivePortal({ hotspotId: selectedHotspot, target: target.trim() || undefined })
      if (result.success) {
        feedback.success(result.message)
        setTarget("")
      } else {
        feedback.error(result.message)
      }
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ferramentas Rápidas</CardTitle>
        <CardDescription>Execute ações imediatas sobre os pontos de acesso monitorados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Hotspot alvo</Label>
          <Select value={selectedHotspot} onValueChange={setSelectedHotspot}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um hotspot" />
            </SelectTrigger>
            <SelectContent>
              {hotspots.map((hotspot) => (
                <SelectItem key={hotspot.id} value={hotspot.id}>
                  {hotspot.nome}
                  {hotspot.status && ` • ${hotspot.status}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            <span className="font-semibold">Desconectar cliente</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Informe o MAC ou usuário conectado para encerrar a sessão imediatamente.
          </p>
          <Input
            placeholder="AA:BB:CC:DD:EE:FF"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          />
          <Button onClick={handleKick} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desconectar cliente"}
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            <span className="font-semibold">Reiniciar SSID</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Reinicia a transmissão da rede, aplicando políticas de banda e de QoS novamente.
          </p>
          <Input placeholder="SSID (opcional)" value={ssid} onChange={(event) => setSsid(event.target.value)} />
          <Button onClick={handleBounce} disabled={isPending} className="w-full" variant="outline">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reiniciar SSID"}
          </Button>
        </div>

        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="font-semibold">Reprovocar portal cativo</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Força a reabertura do portal para todos ou um cliente específico.
          </p>
          <Input placeholder="MAC ou IP (opcional)" value={target} onChange={(event) => setTarget(event.target.value)} />
          <Button onClick={handleTrigger} disabled={isPending} className="w-full" variant="secondary">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reprovocar portal"}
          </Button>
        </div>

        {hotspots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Cadastre hotspots para habilitar as ferramentas de operações.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
