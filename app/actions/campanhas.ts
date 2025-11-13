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
  visualizacoes?: number
  cliques?: number
  conversoes?: number
}

function isMissingClienteColumn(error: { message?: string } | null) {
  if (!error?.message) return false
  return error.message.includes("cliente") || error.message.includes("column")
}

function isColumnError(error: { message?: string } | null) {
  if (!error?.message) return false
  const normalized = error.message.toLowerCase()
  return normalized.includes("column") || normalized.includes("does not exist")
}

const statusToDb: Record<string, string> = {
  ativa: "active",
  pausada: "paused",
  concluida: "completed",
  rascunho: "draft",
}

const statusFromDb: Record<string, string> = {
  active: "ativa",
  paused: "pausada",
  completed: "concluida",
  draft: "rascunho",
}

function normalizeCampanha(row: Record<string, any>): CampanhaRegistro {
  const status = row.status ? statusFromDb[row.status] || row.status : "ativa"
  const conteudo = row.conteudo || row.content || null
  return {
    id: row.id,
    nome: row.nome || row.name || row.titulo || "Campanha",
    tipo: row.tipo || row.type || "popup",
    status,
    conteudo,
    descricao: row.descricao ?? row.description ?? null,
    criado_por: row.criado_por || row.created_by || null,
    cliente_id: row.cliente_id || row.client_id || null,
    criado_em: row.criado_em || row.created_at || null,
    visualizacoes: row.visualizacoes ?? row.views ?? conteudo?.visualizacoes ?? 0,
    cliques: row.cliques ?? row.clicks ?? conteudo?.cliques ?? 0,
    conversoes: row.conversoes ?? conteudo?.conversoes ?? 0,
  }
}

function sanitizePayload(payload: Record<string, any>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

async function insertWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payloads: Record<string, any>[],
) {
  let lastError: any = null
  for (const payload of payloads) {
    const { data, error } = await supabase.from("campanhas").insert(payload).select().single()
    if (!error) return { data, error }
    lastError = error
    if (!isColumnError(error)) return { data, error }
  }
  return { data: null, error: lastError }
}

async function updateWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  payloads: Record<string, any>[],
) {
  let lastError: any = null
  for (const payload of payloads) {
    const { error } = await supabase.from("campanhas").update(payload).eq("id", id)
    if (!error) return { error: null }
    lastError = error
    if (!isColumnError(error)) return { error }
  }
  return { error: lastError }
}

export async function getCampanhas({ includeAll = false }: { includeAll?: boolean } = {}) {
  const supabase = await createClient()
  const session = await getSession()

  const buildQuery = (columns: { createdBy: string; createdAt: string }) => {
    let query = supabase.from("campanhas").select("*").order(columns.createdAt, { ascending: false })
    if (!includeAll && session?.user?.id) {
      query = query.eq(columns.createdBy, session.user.id)
    }
    return query
  }

  let { data, error } = await buildQuery({ createdBy: "criado_por", createdAt: "criado_em" })

  if (error && isColumnError(error)) {
    ;({ data, error } = await buildQuery({ createdBy: "created_by", createdAt: "created_at" }))
  }

  if (error) throw error
  return (data || []).map((row) => normalizeCampanha(row))
}

export async function getCampanhasDoCliente(clienteId: string) {
  const supabase = await createClient()

  const buildQuery = (column: string, createdAt: string) =>
    supabase.from("campanhas").select("*").eq(column, clienteId).order(createdAt, { ascending: false })

  let { data, error } = await buildQuery("cliente_id", "criado_em")

  if (error && isMissingClienteColumn(error)) {
    console.warn("[v0] Campo cliente_id ausente em campanhas. Aplicando fallback por criado_por.")
    error = null
  }

  if (error && isColumnError(error)) {
    ;({ data, error } = await buildQuery("client_id", "created_at"))
  }

  if ((error || !data || data.length === 0) && !isMissingClienteColumn(error)) {
    const fallback = await buildQuery("criado_por", "criado_em")
    data = fallback.data
    error = fallback.error
    if (error && isColumnError(error)) {
      const englishFallback = await buildQuery("created_by", "created_at")
      data = englishFallback.data
      error = englishFallback.error
    }
  }

  if (error) {
    console.error("[v0] Erro ao carregar campanhas do cliente:", error)
    return []
  }

  return (data || []).map((row) => normalizeCampanha(row))
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
    status: campanha.status || "ativa",
    criado_por: session.user.id,
  }

  const payloads: Record<string, any>[] = []

  const portuguesePayload: Record<string, any> = {
    ...basePayload,
    cliente_id: clienteId,
    criado_em: new Date().toISOString(),
    visualizacoes: 0,
    cliques: 0,
    conversoes: 0,
  }

  payloads.push(sanitizePayload(portuguesePayload))

  const englishPayload: Record<string, any> = {
    name: basePayload.nome,
    type: basePayload.tipo,
    description: basePayload.descricao,
    modal_position: basePayload.posicao_modal,
    start_date: basePayload.data_inicio,
    end_date: basePayload.data_fim,
    status: statusToDb[basePayload.status] || basePayload.status,
    content: basePayload.conteudo,
    created_by: basePayload.criado_por,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    client_id: clienteId,
  }

  payloads.push(sanitizePayload(englishPayload))

  let { data, error } = await insertWithFallback(supabase, payloads)

  if (!data || error) {
    if (error) {
      if (isMissingClienteColumn(error) && "cliente_id" in portuguesePayload) {
        console.warn("[v0] Campo cliente_id ausente em campanhas. Recriando registro sem o campo.")
        const { cliente_id: _ignored, ...rest } = portuguesePayload
        ;({ data, error } = await insertWithFallback(supabase, [sanitizePayload(rest), sanitizePayload({ ...englishPayload, client_id: undefined })]))
      }
    }
  }

  if (error || !data) {
    console.error("[v0] Error creating campaign:", error)
    throw error || new Error("Erro ao criar campanha")
  }

  revalidatePath("/client/campaigns")
  return normalizeCampanha(data)
}

export async function updateCampanhaStatus(id: string, status: string) {
  const supabase = await createClient()

  const dbStatus = statusToDb[status] || status
  const payloads = [
    { status, atualizado_em: new Date().toISOString() },
    { status: dbStatus, updated_at: new Date().toISOString() },
  ]

  const { error } = await updateWithFallback(supabase, id, payloads.map((p) => sanitizePayload(p)))

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

  const now = new Date().toISOString()
  const portuguesePayload = sanitizePayload({
    ...formData,
    atualizado_em: now,
  })

  const englishPayload = sanitizePayload({
    name: formData.nome,
    type: formData.tipo,
    description: formData.descricao,
    modal_position: formData.posicao_modal,
    start_date: formData.data_inicio,
    end_date: formData.data_fim,
    status: formData.status ? statusToDb[formData.status] || formData.status : undefined,
    content: formData.conteudo,
    updated_at: now,
  })

  const { error } = await updateWithFallback(supabase, id, [portuguesePayload, englishPayload])

  if (error) {
    console.error("[v0] Error updating campaign:", error)
    throw error
  }

  revalidatePath("/client/campaigns")
  return { success: true }
}
