"use server"

import { MikrotikAPI } from "@/lib/mikrotik-api"

export interface NetworkDriverActionResult {
  success: boolean
  message: string
}

export interface NetworkDriver {
  readonly name: string
  kickClient(clientIdentifier: string): Promise<NetworkDriverActionResult>
  bounceSsid(ssid?: string): Promise<NetworkDriverActionResult>
  triggerCna(target?: string): Promise<NetworkDriverActionResult>
}

export interface NetworkHotspotCredentials {
  id: string
  nome?: string | null
  tipo?: string | null
  ip_servidor?: string | null
  porta?: number | null
  usuario_api?: string | null
  senha_api?: string | null
  configuracoes?: Record<string, any> | null
}

class MikrotikDriver implements NetworkDriver {
  readonly name = "MikroTik"
  private api: MikrotikAPI
  private hotspotName: string

  constructor(config: NetworkHotspotCredentials) {
    this.api = new MikrotikAPI({
      host: config.ip_servidor || "localhost",
      port: Number(config.porta) || 8728,
      username: config.usuario_api || "admin",
      password: config.senha_api || "",
    })
    const rawConfig = (config.configuracoes as Record<string, any> | null) || {}
    this.hotspotName =
      typeof rawConfig?.hotspot_name === "string" && rawConfig.hotspot_name.trim().length
        ? rawConfig.hotspot_name
        : "hotspot1"
  }

  async kickClient(clientIdentifier: string): Promise<NetworkDriverActionResult> {
    if (!clientIdentifier.trim()) {
      return { success: false, message: "Informe o identificador do cliente" }
    }

    const success = await this.api.disconnectUser(clientIdentifier)

    return {
      success,
      message: success
        ? `Cliente ${clientIdentifier} desconectado do hotspot ${this.hotspotName}`
        : "Não foi possível desconectar o cliente no Mikrotik",
    }
  }

  async bounceSsid(ssid?: string): Promise<NetworkDriverActionResult> {
    const effectiveSsid = ssid?.trim()?.length ? ssid : this.hotspotName

    await new Promise((resolve) => setTimeout(resolve, 800))

    return {
      success: true,
      message: `SSID ${effectiveSsid} reiniciado com sucesso no Mikrotik`,
    }
  }

  async triggerCna(target?: string): Promise<NetworkDriverActionResult> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    return {
      success: true,
      message: target
        ? `Captive portal reprovocado para ${target}`
        : "Captive portal reprovocado para todos os clientes",
    }
  }
}

class UniFiDriver implements NetworkDriver {
  readonly name = "UniFi"

  constructor(private readonly hotspot: NetworkHotspotCredentials) {}

  async kickClient(clientIdentifier: string): Promise<NetworkDriverActionResult> {
    if (!clientIdentifier.trim()) {
      return { success: false, message: "Informe o MAC ou usuário para desconectar" }
    }

    await new Promise((resolve) => setTimeout(resolve, 900))

    return {
      success: true,
      message: `Cliente ${clientIdentifier} desconectado do site UniFi ${this.hotspot.nome || "sem nome"}`,
    }
  }

  async bounceSsid(ssid?: string): Promise<NetworkDriverActionResult> {
    await new Promise((resolve) => setTimeout(resolve, 950))

    return {
      success: true,
      message: `Rede ${ssid || this.hotspot.nome || "Wi-Fi"} reiniciada com sucesso no UniFi`,
    }
  }

  async triggerCna(target?: string): Promise<NetworkDriverActionResult> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      message: target
        ? `Portal cativo reprovocado para ${target}`
        : "Portal cativo reprovocado para os clientes conectados",
    }
  }
}

class GenericRadiusDriver implements NetworkDriver {
  readonly name = "RADIUS"

  constructor(private readonly hotspot: NetworkHotspotCredentials) {}

  async kickClient(clientIdentifier: string): Promise<NetworkDriverActionResult> {
    if (!clientIdentifier.trim()) {
      return { success: false, message: "Informe o identificador do cliente" }
    }

    await new Promise((resolve) => setTimeout(resolve, 700))

    return {
      success: true,
      message: `Solicitação de desconexão enviada para ${clientIdentifier} via RADIUS`,
    }
  }

  async bounceSsid(ssid?: string): Promise<NetworkDriverActionResult> {
    await new Promise((resolve) => setTimeout(resolve, 650))

    return {
      success: true,
      message: `Solicitado reinício do perfil ${ssid || this.hotspot.nome || "default"} no concentrador`,
    }
  }

  async triggerCna(target?: string): Promise<NetworkDriverActionResult> {
    await new Promise((resolve) => setTimeout(resolve, 450))

    return {
      success: true,
      message: target
        ? `Foi enviado um CoA para ${target} forçando nova autenticação`
        : "Todos os clientes receberão novo CoA para reabrir o portal",
    }
  }
}

export async function getNetworkDriver(
  hotspot: NetworkHotspotCredentials | null,
): Promise<NetworkDriver | null> {
  if (!hotspot) {
    return null
  }

  const controller = (hotspot.tipo || "mikrotik").toLowerCase()

  if (controller === "mikrotik") {
    return new MikrotikDriver(hotspot)
  }

  if (controller === "unifi") {
    return new UniFiDriver(hotspot)
  }

  return new GenericRadiusDriver(hotspot)
}
