"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

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
      questoes:questoes_enquetes(count)
    `,
    )
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching enquetes:", error)
    return []
  }

  return enquetes
}

export async function createEnquete(formData: {
  titulo: string
  descricao: string
  data_inicio: string
  data_fim: string
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

  const { data: enquete, error: enqueteError } = await supabase
    .from("enquetes")
    .insert({
      titulo: formData.titulo,
      descricao: formData.descricao,
      data_inicio: formData.data_inicio,
      data_fim: formData.data_fim,
      status: "draft",
      total_respostas: 0,
      criado_por: session.user.id,
      revenda_id: session.user.revenda_id,
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
      opcoes: q.opcoes ? JSON.stringify(q.opcoes) : null,
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
