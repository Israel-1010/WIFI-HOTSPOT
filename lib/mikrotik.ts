// Biblioteca para integração com Mikrotik RouterOS API
// Realiza login de usuários no hotspot via REST API

interface MikrotikConfig {
  host: string
  username: string
  password: string
  hotspotName?: string
}

interface HotspotUser {
  username: string
  password: string
  profile?: string
  comment?: string
}

export class MikrotikClient {
  private config: MikrotikConfig
  private baseUrl: string

  constructor(config: MikrotikConfig) {
    this.config = config
    this.baseUrl = `http://${config.host}/rest`
  }

  private async request(endpoint: string, method = "GET", body?: any) {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`Mikrotik API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Erro ao conectar com Mikrotik:", error)
      throw error
    }
  }

  // Criar ou atualizar usuário no hotspot
  async createHotspotUser(user: HotspotUser): Promise<boolean> {
    try {
      // Verificar se usuário já existe
      const existingUsers = await this.request(`/ip/hotspot/user?name=${user.username}`)

      if (existingUsers && existingUsers.length > 0) {
        // Atualizar usuário existente
        await this.request(`/ip/hotspot/user/${existingUsers[0][".id"]}`, "PATCH", {
          password: user.password,
          comment: user.comment || "OAuth Login",
        })
        console.log("[v0] Usuário Mikrotik atualizado:", user.username)
      } else {
        // Criar novo usuário
        await this.request("/ip/hotspot/user/add", "POST", {
          name: user.username,
          password: user.password,
          profile: user.profile || "default",
          comment: user.comment || "OAuth Login",
          server: this.config.hotspotName || "hotspot1",
        })
        console.log("[v0] Usuário Mikrotik criado:", user.username)
      }

      return true
    } catch (error) {
      console.error("[v0] Erro ao criar usuário no Mikrotik:", error)
      return false
    }
  }

  // Fazer login do usuário no hotspot
  async loginUser(username: string, macAddress?: string): Promise<boolean> {
    try {
      // Adicionar usuário ativo no hotspot
      await this.request("/ip/hotspot/active/add", "POST", {
        user: username,
        "mac-address": macAddress,
        server: this.config.hotspotName || "hotspot1",
      })

      console.log("[v0] Login no Mikrotik realizado:", username)
      return true
    } catch (error) {
      console.error("[v0] Erro ao fazer login no Mikrotik:", error)
      return false
    }
  }

  // Remover usuário ativo (logout)
  async logoutUser(username: string): Promise<boolean> {
    try {
      const activeUsers = await this.request(`/ip/hotspot/active?user=${username}`)

      if (activeUsers && activeUsers.length > 0) {
        await this.request(`/ip/hotspot/active/${activeUsers[0][".id"]}`, "DELETE")
        console.log("[v0] Logout no Mikrotik realizado:", username)
      }

      return true
    } catch (error) {
      console.error("[v0] Erro ao fazer logout no Mikrotik:", error)
      return false
    }
  }
}

// Helper para criar cliente Mikrotik a partir das configurações do cliente
export async function createMikrotikClient(clienteId: string): Promise<MikrotikClient | null> {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from("clientes")
    .select("mikrotik_host, mikrotik_username, mikrotik_password, mikrotik_hotspot_name, mikrotik_enabled")
    .eq("id", clienteId)
    .single()

  if (!cliente || !cliente.mikrotik_enabled || !cliente.mikrotik_host) {
    console.log("[v0] Mikrotik não configurado para este cliente")
    return null
  }

  return new MikrotikClient({
    host: cliente.mikrotik_host,
    username: cliente.mikrotik_username,
    password: cliente.mikrotik_password,
    hotspotName: cliente.mikrotik_hotspot_name || "hotspot1",
  })
}
