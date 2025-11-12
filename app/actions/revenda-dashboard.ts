"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDashboardStats(revendaId: string) {
  const supabase = await createClient()

  try {
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

    // Hotspots online
    const { count: hotspotsOnline } = await supabase
      .from("hotspots")
      .select("*", { count: "exact", head: true })
      .eq("revenda_id", revendaId)
      .eq("status", "ativo")

    // Conexões hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { count: conexoesHoje } = await supabase
      .from("sessoes_wifi")
      .select("hotspots!inner(*)", { count: "exact", head: true })
      .eq("hotspots.revenda_id", revendaId)
      .gte("inicio", hoje.toISOString())

    // Usuários online agora
    const { count: usuariosOnline } = await supabase
      .from("sessoes_wifi")
      .select("hotspots!inner(*)", { count: "exact", head: true })
      .eq("hotspots.revenda_id", revendaId)
      .is("fim", null)

    // Receita mensal (faturas pagas este mês)
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const { data: faturasData } = await supabase
      .from("faturas")
      .select("valor_final")
      .eq("revenda_id", revendaId)
      .eq("status", "paga")
      .gte("data_pagamento", primeiroDiaMes.toISOString())

    const receitaMensal = faturasData?.reduce((sum, f) => sum + Number(f.valor_final), 0) || 0

    // Faturas pendentes
    const { count: faturasPendentes } = await supabase
      .from("faturas")
      .select("*", { count: "exact", head: true })
      .eq("revenda_id", revendaId)
      .eq("status", "pendente")

    return {
      totalClientes: totalClientes || 0,
      totalHotspots: totalHotspots || 0,
      hotspotsOnline: hotspotsOnline || 0,
      conexoesHoje: conexoesHoje || 0,
      usuariosOnline: usuariosOnline || 0,
      receitaMensal,
      faturasPendentes: faturasPendentes || 0,
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar estatísticas:", error)
    return {
      totalClientes: 0,
      totalHotspots: 0,
      hotspotsOnline: 0,
      conexoesHoje: 0,
      usuariosOnline: 0,
      receitaMensal: 0,
      faturasPendentes: 0,
    }
  }
}

export async function getClientesComDetalhes(revendaId: string) {
  const supabase = await createClient()

  try {
    const { data: clientes, error } = await supabase
      .from("usuarios")
      .select(`
        *,
        planos:plano_id(*),
        limites:limites_cliente(*),
        hotspots:hotspots(count)
      `)
      .eq("revenda_id", revendaId)
      .eq("role", "cliente")
      .order("criado_em", { ascending: false })

    if (error) throw error

    // Buscar conexões de hoje para cada cliente
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const clientesComStats = await Promise.all(
      (clientes || []).map(async (cliente) => {
        const { count: conexoesHoje } = await supabase
          .from("sessoes_wifi")
          .select("hotspots!inner(*)", { count: "exact", head: true })
          .eq("hotspots.cliente_id", cliente.id)
          .gte("inicio", hoje.toISOString())

        return {
          ...cliente,
          conexoesHoje: conexoesHoje || 0,
        }
      }),
    )

    return clientesComStats
  } catch (error) {
    console.error("[v0] Erro ao buscar clientes:", error)
    return []
  }
}

export async function getHotspotsPorCliente(clienteId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("hotspots")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("criado_em", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Erro ao buscar hotspots:", error)
    return []
  }
}

export async function getFaturasPorCliente(clienteId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("faturas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("data_emissao", { ascending: false })
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("[v0] Erro ao buscar faturas:", error)
    return []
  }
}
