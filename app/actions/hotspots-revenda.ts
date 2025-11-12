"use server"

import { createClient } from "@/lib/supabase/server"

export async function getHotspots(revendaId: string) {
  const supabase = await createClient()

  const { data: hotspots, error } = await supabase
    .from("hotspots")
    .select("*")
    .eq("revenda_id", revendaId)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("Erro ao buscar hotspots:", error)
    return []
  }

  if (hotspots && hotspots.length > 0) {
    const clienteIds = [...new Set(hotspots.map((h) => h.cliente_id).filter(Boolean))]

    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase.from("usuarios").select("id, nome_completo, email").in("id", clienteIds)

      // Adicionar dados do cliente a cada hotspot
      const hotspotsComClientes = hotspots.map((hotspot) => ({
        ...hotspot,
        usuarios: clientes?.find((c) => c.id === hotspot.cliente_id) || null,
      }))

      return hotspotsComClientes
    }
  }

  return hotspots || []
}

export async function createHotspot(data: {
  revendaId: string
  clienteId: string
  nome: string
  localizacao: string
  tipo: string
  ip_servidor?: string
  porta?: number
  usuario_api?: string
  senha_api?: string
  secret_radius?: string
}) {
  const supabase = await createClient()

  const { data: hotspot, error } = await supabase
    .from("hotspots")
    .insert({
      revenda_id: data.revendaId,
      cliente_id: data.clienteId,
      nome: data.nome,
      localizacao: data.localizacao,
      tipo: data.tipo,
      ip_servidor: data.ip_servidor,
      porta: data.porta,
      usuario_api: data.usuario_api,
      senha_api: data.senha_api,
      secret_radius: data.secret_radius,
      status: "ativo",
    })
    .select()
    .single()

  if (error) {
    console.error("Erro ao criar hotspot:", error)
    return { success: false, error: error.message }
  }

  return { success: true, data: hotspot }
}

export async function updateHotspotStatus(hotspotId: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("hotspots").update({ status }).eq("id", hotspotId)

  if (error) {
    console.error("Erro ao atualizar status:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
