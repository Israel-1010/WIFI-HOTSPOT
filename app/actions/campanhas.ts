"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

type CampanhaRegistro = {
  id: string
  nome: string
  tipo: string
  status: string
  conteudo: Record<string, any> | null
  descricao?: string | null
  criado_por?: string | null
  cliente_id?: string | null
  criado_em?: string
}

function isMissingClienteColumn(error: { message?: string } | null) {
  if (!error?.message) return false
  return error.message.includes("cliente") || error.message.includes("column")
}

export async function getCampanhas({ includeAll = false }: { includeAll?: boolean } = {}) {
  const supabase = await createClient()
  const session = await getSession()

  let query = supabase.from("campanhas").select("*").order("criado_em", { ascending: false })

  if (!includeAll && session?.user?.id) {
    query = query.eq("criado_por", session.user.id)
  }

  const { data, error } = await query

  if (error) throw error
  return (data as CampanhaRegistro[]) || []
}

export async function getCampanhasDoCliente(clienteId: string) {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from("campanhas")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })

  if (error && isMissingClienteColumn(error)) {
    console.warn("[v0] Campo cliente_id ausente em campanhas. Aplicando fallback por criado_por.")
    error = null
  }

  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from("campanhas")
      .select("*")
      .eq("criado_por", clienteId)
      .order("criado_em", { ascending: false })

    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error("[v0] Erro ao carregar campanhas do cliente:", error)
    return []
  }

  return (data as CampanhaRegistro[]) || []
}

export async function createCampanha(campanha: any) {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) throw new Error("Não autenticado")

  const clienteId = session.user.role === "cliente" ? session.user.id : session.user.cliente_id

  const basePayload = {
    nome: campanha.nome || campanha.name,
    tipo: campanha.tipo || campanha.type,
    conteudo: campanha.conteudo || campanha.content,
    descricao: campanha.descricao || campanha.description,
    posicao_modal: campanha.posicao_modal || campanha.modal_position || "center",
    data_inicio: campanha.data_inicio || campanha.start_date,
    data_fim: campanha.data_fim || campanha.end_date,
    status: "ativa",
    visualizacoes: 0,
    cliques: 0,
    conversoes: 0,
    criado_por: session.user.id,
  }

  const payload: Record<string, any> = clienteId ? { ...basePayload, cliente_id: clienteId } : basePayload

  let { data, error } = await supabase.from("campanhas").insert(payload).select().single()

  if (error && isMissingClienteColumn(error) && "cliente_id" in payload) {
    console.warn("[v0] Campo cliente_id ausente em campanhas. Recriando registro sem o campo.")
    const { cliente_id: _ignored, ...fallbackPayload } = payload
    ;({ data, error } = await supabase.from("campanhas").insert(fallbackPayload).select().single())
  }

  if (error) {
    console.error("[v0] Error creating campaign:", error)
    throw error
  }

  revalidatePath("/client/campaigns")
  return data
}

export async function updateCampanhaStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("campanhas").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating campaign status:", error)
    throw error
  }

  revalidatePath("/client/campaigns")
}

export async function deleteCampanha(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("campanhas").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting campaign:", error)
    throw error
  }

  revalidatePath("/client/campaigns")
}

export async function updateCampanha(
  id: string,
  formData: {
    nome?: string
    tipo?: string
    conteudo?: any
    descricao?: string
    posicao_modal?: string
    data_inicio?: string
    data_fim?: string
    status?: string
  },
) {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const { error } = await supabase
    .from("campanhas")
    .update({
      ...formData,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[v0] Error updating campaign:", error)
    throw error
  }

  revalidatePath("/client/campaigns")
  return { success: true }
}
