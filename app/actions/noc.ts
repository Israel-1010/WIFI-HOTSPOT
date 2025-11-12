"use server"

import { createClient } from "@/lib/supabase/server"

interface HotspotRecord {
  id: string
  nome: string
  localizacao?: string | null
  status?: string | null
  usuarios_conectados?: number | null
  ultimo_ping?: string | null
  configuracoes?: Record<string, any> | null
  tipo?: string | null
  ip_servidor?: string | null
  porta?: number | null
  usuario_api?: string | null
  senha_api?: string | null
  revenda_id?: string | null
  cliente_id?: string | null
}

function parseConfig(config: unknown): Record<string, any> {
  if (!config) return {}
  if (typeof config === "string") {
    try {
      const parsed = JSON.parse(config)
      return typeof parsed === "object" && parsed !== null ? parsed : {}
    } catch (error) {
      console.error("[v0] Falha ao converter configuracoes do hotspot:", error)
      return {}
    }
  }

  if (typeof config === "object") {
    return config as Record<string, any>
  }

  return {}
}

function sanitizeNumber(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const numeric = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
    return Number.isFinite(numeric) ? numeric : null
  }

  return null
}

export interface OperationsOverview {
  sla: number
  totalAps: number
  online: number
  offline: number
  manutencao: number
  clientesConectados: number
  incidentesCriticos: number
  retencao: {
    dias30: number
    dias60: number
    dias90: number
  }
  uptimePorSite: Array<{
    id: string
    nome: string
    localizacao: string | null
    status: string | null
    ultimoPing: string | null
    uptime: number
  }>
}

export interface AccessPointMarker {
  id: string
  nome: string
  localizacao: string | null
  status: string | null
  usuariosConectados: number
  alerts: string[]
  lastPing: string | null
  latitude: number | null
  longitude: number | null
}

export interface AccessPointMapData {
  markers: AccessPointMarker[]
  totalAlerts: number
}

export interface LoginFailureInsights {
  topMotivos: Array<{ motivo: string; total: number }>
  registrosRecentes: Array<{
    id: string
    mensagem: string
    criado_em: string
    mac_address?: string | null
    hotspot_id?: string | null
    tipo: string
  }>
}

export interface HealthCheckInsights {
  checks: Array<{
    hotspotId: string
    nome: string
    status: string | null
    latencyMs: number | null
    packetLoss: number | null
    firmware: string | null
    lastCheck: string | null
  }>
  firmwareOutdated: number
}

const ONLINE_THRESHOLD_MINUTES = 15

export async function getOperationsOverview({
  revendaId,
}: { revendaId?: string | null } = {}): Promise<OperationsOverview> {
  const supabase = await createClient()

  let query = supabase
    .from("hotspots")
    .select("id, nome, localizacao, status, usuarios_conectados, ultimo_ping, configuracoes, revenda_id")

  if (revendaId) {
    query = query.eq("revenda_id", revendaId)
  }

  const { data: hotspots, error } = await query

  if (error) {
    console.error("[v0] Erro ao buscar hotspots para overview NOC:", error)
    return {
      sla: 0,
      totalAps: 0,
      online: 0,
      offline: 0,
      manutencao: 0,
      clientesConectados: 0,
      incidentesCriticos: 0,
      retencao: { dias30: 0, dias60: 0, dias90: 0 },
      uptimePorSite: [],
    }
  }

  const now = Date.now()
  let online = 0
  let offline = 0
  let manutencao = 0
  let clientesConectados = 0
  const uptimePorSite: OperationsOverview["uptimePorSite"] = []

  for (const hotspot of hotspots as HotspotRecord[]) {
    clientesConectados += Number(hotspot.usuarios_conectados || 0)
    const status = (hotspot.status || "").toLowerCase()
    const lastPingDate = hotspot.ultimo_ping ? new Date(hotspot.ultimo_ping) : null
    const minutesSinceLastPing = lastPingDate ? (now - lastPingDate.getTime()) / 60000 : Number.POSITIVE_INFINITY
    const isWithinThreshold = minutesSinceLastPing <= ONLINE_THRESHOLD_MINUTES

    if (status === "manutencao") {
      manutencao += 1
    } else if (status === "ativo" && isWithinThreshold) {
      online += 1
    } else if (status === "ativo" && !isWithinThreshold) {
      offline += 1
    } else if (status === "offline") {
      offline += 1
    } else {
      offline += 1
    }

    const config = parseConfig(hotspot.configuracoes)
    const configUptime = sanitizeNumber(config?.uptime_percentual)
    const uptime = configUptime ?? (isWithinThreshold ? 99.5 : Math.max(15, 100 - Math.min(100, minutesSinceLastPing)))

    uptimePorSite.push({
      id: hotspot.id,
      nome: hotspot.nome,
      localizacao: hotspot.localizacao || null,
      status: hotspot.status || null,
      ultimoPing: hotspot.ultimo_ping || null,
      uptime: Number(uptime.toFixed(2)),
    })
  }

  const totalAps = hotspots?.length || 0
  const sla = totalAps ? Number(((online / totalAps) * 100).toFixed(2)) : 0

  let incidentesCriticos = 0
  try {
    const hotspotIds = (hotspots as HotspotRecord[]).map((hotspot) => hotspot.id)
    if (hotspotIds.length > 0) {
      const vinteQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const incidentQuery = supabase
        .from("logs_atividades")
        .select("id")
        .gte("criado_em", vinteQuatroHorasAtras.toISOString())
        .or("tipo.eq.incident,tipo.eq.alerta_critico")
        .in("hotspot_id", hotspotIds)

      const { data: incidentes, error: incidentError } = await incidentQuery
      if (!incidentError && incidentes) {
        incidentesCriticos = incidentes.length
      }
    }
  } catch (incidentError) {
    console.error("[v0] Falha ao buscar incidentes críticos:", incidentError)
  }

  const retencao = await calcularRetencao(supabase, hotspots as HotspotRecord[])

  return {
    sla,
    totalAps,
    online,
    offline,
    manutencao,
    clientesConectados,
    incidentesCriticos,
    retencao,
    uptimePorSite,
  }
}

async function calcularRetencao(supabase: Awaited<ReturnType<typeof createClient>>, hotspots: HotspotRecord[]) {
  const hotspotIds = hotspots.map((hotspot) => hotspot.id)

  if (!hotspotIds.length) {
    return { dias30: 0, dias60: 0, dias90: 0 }
  }

  const noventaDiasAtras = new Date()
  noventaDiasAtras.setDate(noventaDiasAtras.getDate() - 90)

  const { data: sessoes, error } = await supabase
    .from("sessoes_wifi")
    .select("usuario_social_id, inicio, hotspot_id")
    .gte("inicio", noventaDiasAtras.toISOString())
    .in("hotspot_id", hotspotIds)

  if (error || !sessoes) {
    if (error) {
      console.error("[v0] Erro ao calcular retenção de usuários:", error)
    }
    return { dias30: 0, dias60: 0, dias90: 0 }
  }

  const agora = new Date()

  const calcular = (dias: number) => {
    const limite = new Date(agora)
    limite.setDate(limite.getDate() - dias)
    const relevantes = sessoes.filter((sessao) => new Date(sessao.inicio) >= limite)
    const contagem = new Map<string, number>()

    for (const sessao of relevantes) {
      if (!sessao.usuario_social_id) continue
      const atual = contagem.get(sessao.usuario_social_id) || 0
      contagem.set(sessao.usuario_social_id, atual + 1)
    }

    const retornando = Array.from(contagem.values()).filter((valor) => valor > 1).length
    const total = contagem.size

    return total ? Math.round((retornando / total) * 100) : 0
  }

  return {
    dias30: calcular(30),
    dias60: calcular(60),
    dias90: calcular(90),
  }
}

export async function getAccessPointMap({
  revendaId,
}: { revendaId?: string | null } = {}): Promise<AccessPointMapData> {
  const supabase = await createClient()

  let query = supabase
    .from("hotspots")
    .select("id, nome, localizacao, status, usuarios_conectados, ultimo_ping, configuracoes, tipo, ip_servidor, porta, usuario_api, senha_api")
    .order("nome")

  if (revendaId) {
    query = query.eq("revenda_id", revendaId)
  }

  const { data: hotspots, error } = await query

  if (error || !hotspots) {
    if (error) {
      console.error("[v0] Erro ao carregar dados do mapa de APs:", error)
    }
    return { markers: [], totalAlerts: 0 }
  }

  let totalAlerts = 0

  const markers: AccessPointMarker[] = (hotspots as HotspotRecord[]).map((hotspot) => {
    const config = parseConfig(hotspot.configuracoes)
    const latitude = sanitizeNumber(config?.latitude ?? config?.lat) ?? null
    const longitude = sanitizeNumber(config?.longitude ?? config?.lng ?? config?.lon) ?? null
    const usuarios = Number(hotspot.usuarios_conectados || 0)
    const lastPing = hotspot.ultimo_ping || null
    const alerts: string[] = []

    if ((hotspot.status || "").toLowerCase() !== "ativo") {
      alerts.push("Offline")
    }

    if (lastPing) {
      const minutos = (Date.now() - new Date(lastPing).getTime()) / 60000
      if (minutos > ONLINE_THRESHOLD_MINUTES) {
        alerts.push("Sem telemetria recente")
      }
    }

    if (usuarios > (sanitizeNumber(config?.usuarios_simultaneos) ?? 50)) {
      alerts.push("Capacidade próxima do limite")
    }

    totalAlerts += alerts.length

    return {
      id: hotspot.id,
      nome: hotspot.nome,
      localizacao: hotspot.localizacao || null,
      status: hotspot.status || null,
      usuariosConectados: usuarios,
      alerts,
      lastPing,
      latitude,
      longitude,
    }
  })

  return { markers, totalAlerts }
}

export async function getLoginFailureInsights({
  revendaId,
  limit = 10,
}: { revendaId?: string | null; limit?: number } = {}): Promise<LoginFailureInsights> {
  const supabase = await createClient()

  let hotspotIds: string[] | null = null
  if (revendaId) {
    const { data: hotspots } = await supabase.from("hotspots").select("id").eq("revenda_id", revendaId)
    hotspotIds = hotspots?.map((hotspot) => hotspot.id) || []
    if (!hotspotIds.length) {
      return { topMotivos: [], registrosRecentes: [] }
    }
  }

  let query = supabase
    .from("logs_atividades")
    .select("id, tipo, mensagem, detalhes, criado_em, mac_address, hotspot_id")
    .order("criado_em", { ascending: false })
    .limit(limit * 5)

  if (hotspotIds) {
    query = query.in("hotspot_id", hotspotIds)
  }

  const { data: logs, error } = await query

  if (error || !logs) {
    if (error) {
      console.error("[v0] Erro ao carregar falhas de login:", error)
    }
    return { topMotivos: [], registrosRecentes: [] }
  }

  const failureLogs = logs.filter((log) => {
    const tipo = (log.tipo || "").toLowerCase()
    if (!tipo.includes("login")) return false
    return tipo.includes("fail") || tipo.includes("erro") || tipo.includes("denied")
  })

  const motivos = new Map<string, number>()

  for (const log of failureLogs) {
    let detalhes: Record<string, any> | null = null
    if (typeof log.detalhes === "string") {
      try {
        detalhes = JSON.parse(log.detalhes)
      } catch (parseError) {
        detalhes = null
      }
    } else if (log.detalhes && typeof log.detalhes === "object") {
      detalhes = log.detalhes as Record<string, any>
    }

    const motivo =
      typeof detalhes?.motivo === "string" && detalhes.motivo.trim().length
        ? detalhes.motivo
        : log.mensagem || "Falha de login"

    motivos.set(motivo, (motivos.get(motivo) || 0) + 1)
  }

  const topMotivos = Array.from(motivos.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([motivo, total]) => ({ motivo, total }))

  const registrosRecentes = failureLogs.slice(0, limit).map((log) => ({
    id: log.id,
    mensagem: log.mensagem || "Falha de login",
    criado_em: log.criado_em,
    mac_address: log.mac_address,
    hotspot_id: log.hotspot_id,
    tipo: log.tipo,
  }))

  return { topMotivos, registrosRecentes }
}

export async function getHealthChecks({
  revendaId,
  limit = 12,
}: { revendaId?: string | null; limit?: number } = {}): Promise<HealthCheckInsights> {
  const supabase = await createClient()

  let query = supabase
    .from("hotspots")
    .select("id, nome, status, configuracoes, ultimo_ping")
    .order("nome")

  if (revendaId) {
    query = query.eq("revenda_id", revendaId)
  }

  const { data: hotspots, error } = await query

  if (error || !hotspots) {
    if (error) {
      console.error("[v0] Erro ao buscar health checks:", error)
    }
    return { checks: [], firmwareOutdated: 0 }
  }

  let firmwareOutdated = 0

  const checks = (hotspots as HotspotRecord[]).slice(0, limit).map((hotspot) => {
    const config = parseConfig(hotspot.configuracoes)
    const monitoramento = typeof config.monitoramento === "object" ? config.monitoramento : {}

    const latency = sanitizeNumber(monitoramento?.latencia_ms ?? config?.latencia_ms)
    const packetLoss = sanitizeNumber(monitoramento?.perda_pacotes ?? config?.perda_pacotes)
    const firmwareAtual =
      typeof config?.firmware === "string"
        ? config.firmware
        : typeof monitoramento?.firmware === "string"
          ? monitoramento.firmware
          : null
    const firmwareDisponivel =
      typeof monitoramento?.firmware_disponivel === "string"
        ? monitoramento.firmware_disponivel
        : typeof config?.firmware_disponivel === "string"
          ? config.firmware_disponivel
          : null

    if (firmwareAtual && firmwareDisponivel && firmwareAtual !== firmwareDisponivel) {
      firmwareOutdated += 1
    }

    return {
      hotspotId: hotspot.id,
      nome: hotspot.nome,
      status: hotspot.status || null,
      latencyMs: latency,
      packetLoss: packetLoss,
      firmware: firmwareAtual,
      lastCheck: (monitoramento?.ultimo_teste as string | undefined) || hotspot.ultimo_ping || null,
    }
  })

  return { checks, firmwareOutdated }
}
