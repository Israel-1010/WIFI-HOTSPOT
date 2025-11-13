"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { ensurePerfilForUser } from "@/lib/perfis"

function normalizeQuestao(questao: any) {
  if (!questao) return questao
  let opcoes = questao.opcoes
  if (typeof opcoes === "string") {
    try {
      opcoes = JSON.parse(opcoes)
    } catch (error) {
      console.warn("[v0] Falha ao converter opções da enquete", error)
      opcoes = []
    }
  }

  if (!Array.isArray(opcoes)) {
    opcoes = []
  }

  return { ...questao, opcoes }
}

function normalizeEnquete(enquete: any) {
  return {
    ...enquete,
    questoes: (enquete?.questoes || []).map(normalizeQuestao),
  }
}

export async function getEnquetes() {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) {
    return []
  }

  const { data: enquetes, error } = await supabase
    .from("enquetes")
    .select(
      `
      *,
      questoes:questoes_enquetes(*)
    `,
    )
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching enquetes:", error)
    return []
  }

  return (enquetes || []).map(normalizeEnquete)
}

export async function getEnquetesDoCliente(clienteId: string) {
  const supabase = await createClient()

  let { data, error } = await supabase
    .from("enquetes")
    .select(
      `
      *,
      questoes:questoes_enquetes(*)
    `,
    )
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })

  if (error && error.message?.includes("cliente")) {
    console.warn("[v0] Campo cliente_id não encontrado em enquetes. Usando fallback por criado_por.")
    error = null
  }

  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from("enquetes")
      .select(
        `
        *,
        questoes:questoes_enquetes(*)
      `,
      )
      .eq("criado_por", clienteId)
      .order("criado_em", { ascending: false })

    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error("[v0] Erro ao carregar enquetes do cliente:", error)
    return []
  }

  return (data || []).map(normalizeEnquete)
}

export async function createEnquete(formData: {
  titulo: string
  descricao: string
  data_inicio?: string | null
  data_fim?: string | null
  questoes: Array<{
    pergunta: string
    tipo: string
    opcoes?: string[]
    obrigatoria: boolean
  }>
}) {
  const supabase = await createClient()
  const session = await getSession()

  if (!session?.user) {
    throw new Error("Não autorizado")
  }

  const { perfilId } = await ensurePerfilForUser(supabase, session.user)

  const { data: enquete, error: enqueteError } = await supabase
    .from("enquetes")
    .insert({
      titulo: formData.titulo,
      descricao: formData.descricao,
      data_inicio: formData.data_inicio || null,
      data_fim: formData.data_fim || null,
      status: "ativa",
      total_respostas: 0,
      criado_por: perfilId || undefined,
    })
    .select()
    .single()

  if (enqueteError) {
    console.error("[v0] Error creating enquete:", enqueteError)
    throw new Error("Falha ao criar enquete")
  }

  if (formData.questoes && formData.questoes.length > 0) {
    const questoes = formData.questoes.map((q, index) => ({
      enquete_id: enquete.id,
      pergunta: q.pergunta,
      tipo: q.tipo,
      opcoes: q.opcoes && q.opcoes.length > 0 ? JSON.stringify(q.opcoes) : null,
      obrigatoria: q.obrigatoria,
      ordem: index + 1,
    }))

    const { error: questoesError } = await supabase.from("questoes_enquetes").insert(questoes)

    if (questoesError) {
      console.error("[v0] Error creating questoes:", questoesError)
      // Rollback: deletar enquete se falhar ao criar questões
      await supabase.from("enquetes").delete().eq("id", enquete.id)
      throw new Error("Falha ao criar questões da enquete")
    }
  }

  revalidatePath("/client/surveys")
  return enquete
}

export async function updateEnqueteStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("enquetes").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating enquete:", error)
    throw new Error("Falha ao atualizar enquete")
  }

  revalidatePath("/client/surveys")
}

export async function deleteEnquete(id: string) {
  const supabase = await createClient()

  await supabase.from("questoes_enquetes").delete().eq("enquete_id", id)

  const { error } = await supabase.from("enquetes").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting enquete:", error)
    throw new Error("Falha ao deletar enquete")
  }

  revalidatePath("/client/surveys")
}

export async function getEnqueteComQuestoes(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("enquetes")
    .select(
      `
      *,
      questoes:questoes_enquetes(*)
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("[v0] Error fetching enquete:", error)
    return null
  }

  return data
}
