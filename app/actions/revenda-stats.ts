"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export async function getRevendaStats() {
  const session = await getSession()
  if (!session || session.user.role !== "admin_revenda") {
    return null
  }

  const supabase = await createClient()
  const revendaId = session.user.revenda_id

  // Total de clientes
  const { count: totalClientes } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .eq("revenda_id", revendaId)
    .eq("role", "cliente")

  // Total de hotspots
  const { count: totalHotspots } = await supabase
    .from("hotspots")
    .select("*", { count: "exact", head: true })
    .eq("revenda_id", revendaId)

  // Total de acessos hoje
  const hoje = new Date().toISOString().split("T")[0]
  const { count: acessosHoje } = await supabase
    .from("logs_oauth")
    .select("*", { count: "exact", head: true })
    .eq("revenda_id", revendaId)
    .gte("criado_em", hoje)

  // Usuários online agora
  const { count: usuariosOnline } = await supabase
    .from("sessoes_social")
    .select("*", { count: "exact", head: true })
    .eq("revenda_id", revendaId)
    .gt("expira_em", new Date().toISOString())

  return {
    totalClientes: totalClientes || 0,
    totalHotspots: totalHotspots || 0,
    acessosHoje: acessosHoje || 0,
    usuariosOnline: usuariosOnline || 0,
  }
}

export async function getClientesComAcessos() {
  const session = await getSession()
  if (!session || session.user.role !== "admin_revenda") {
    return []
  }

  const supabase = await createClient()
  const revendaId = session.user.revenda_id

  // Buscar clientes da revenda
  const { data: clientes } = await supabase
    .from("usuarios")
    .select("id, nome_completo, empresa, email, telefone, plano_id, criado_em")
    .eq("revenda_id", revendaId)
    .eq("role", "cliente")
    .order("criado_em", { ascending: false })

  if (!clientes) return []

  // Para cada cliente, buscar estatísticas de acessos
  const clientesComStats = await Promise.all(
    clientes.map(async (cliente) => {
      // Total de hotspots do cliente
      const { count: totalHotspots } = await supabase
        .from("hotspots")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", cliente.id)

      // Total de acessos do cliente
      const { count: totalAcessos } = await supabase
        .from("logs_oauth")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", cliente.id)

      // Acessos hoje
      const hoje = new Date().toISOString().split("T")[0]
      const { count: acessosHoje } = await supabase
        .from("logs_oauth")
        .select("*", { count: "exact", head: true })
        .eq("cliente_id", cliente.id)
        .gte("criado_em", hoje)

      // Buscar plano
      let plano = null
      if (cliente.plano_id) {
        const { data: planoData } = await supabase.from("planos").select("nome").eq("id", cliente.plano_id).single()
        plano = planoData
      }

      return {
        ...cliente,
        plano: plano?.nome || "Sem plano",
        totalHotspots: totalHotspots || 0,
        totalAcessos: totalAcessos || 0,
        acessosHoje: acessosHoje || 0,
      }
    }),
  )

  return clientesComStats
}
