"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getRevendas() {
  const supabase = await createClient()

  // Buscar revendas
  const { data: revendas, error: revendasError } = await supabase
    .from("revendas")
    .select("*")
    .order("criado_em", { ascending: false })

  if (revendasError) throw revendasError

  // Buscar planos
  const { data: planos, error: planosError } = await supabase.from("planos").select("id, nome, preco_mensal")

  if (planosError) throw planosError

  // Buscar contagem de perfis por revenda
  const { data: perfisCount, error: perfisError } = await supabase.from("perfis").select("revenda_id")

  if (perfisError) throw perfisError

  // Juntar os dados
  const revendasComDados = revendas?.map((revenda) => {
    const plano = planos?.find((p) => p.id === revenda.plano_id)
    const totalPerfis = perfisCount?.filter((p) => p.revenda_id === revenda.id).length || 0

    return {
      ...revenda,
      plano: plano ? { nome: plano.nome, preco_mensal: plano.preco_mensal } : null,
      perfis: [{ count: totalPerfis }],
    }
  })

  return revendasComDados
}

export async function createRevenda(formData: {
  nome: string
  dominio: string
  plano_id: string
  limite_clientes: number
  limite_hotspots: number
  limite_usuarios_simultaneos: number
  cor_primaria?: string
  cor_secundaria?: string
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("revendas")
    .insert({
      ...formData,
      status: "ativa",
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/admin-geral/revendas")
  return data
}

export async function updateRevenda(
  id: string,
  formData: Partial<{
    nome: string
    dominio: string
    plano_id: string
    limite_clientes: number
    limite_hotspots: number
    limite_usuarios_simultaneos: number
    cor_primaria: string
    cor_secundaria: string
    status: string
  }>,
) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("revendas").update(formData).eq("id", id).select().single()

  if (error) throw error

  revalidatePath("/admin-geral/revendas")
  return data
}

export async function deleteRevenda(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("revendas").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/admin-geral/revendas")
}

export async function getPlanos() {
  const supabase = await createClient()

  const { data: planos, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("preco_mensal", { ascending: true })

  if (error) throw error
  return planos
}

export async function getMetricasGlobais() {
  const supabase = await createClient()

  // Total de revendas
  const { count: totalRevendas } = await supabase
    .from("revendas")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativa")

  // Total de clientes
  const { count: totalClientes } = await supabase
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("role", "cliente")

  // Total de hotspots
  const { count: totalHotspots } = await supabase
    .from("hotspots")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo")

  // Usuários conectados
  const { data: hotspots } = await supabase.from("hotspots").select("usuarios_conectados").eq("status", "ativo")

  const usuariosConectados = hotspots?.reduce((sum, h) => sum + (h.usuarios_conectados || 0), 0) || 0

  return {
    totalRevendas: totalRevendas || 0,
    totalClientes: totalClientes || 0,
    totalHotspots: totalHotspots || 0,
    usuariosConectados,
  }
}
