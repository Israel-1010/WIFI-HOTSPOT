"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getSurveys() {
  const supabase = await createClient()

  const { data: surveys, error } = await supabase
    .from("enquetes")
    .select(`
      *,
      questoes_enquetes (*)
    `)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching surveys:", error)
    return []
  }

  return surveys
}

export async function createSurvey(formData: {
  titulo: string
  descricao: string
  questions: Array<{
    tipo: string
    pergunta: string
    opcoes?: string[]
    obrigatoria: boolean
  }>
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data: survey, error: surveyError } = await supabase
    .from("enquetes")
    .insert({
      titulo: formData.titulo,
      descricao: formData.descricao,
      status: "draft",
      total_respostas: 0,
      criado_por: user.id,
    })
    .select()
    .single()

  if (surveyError || !survey) {
    console.error("[v0] Error creating survey:", surveyError)
    throw new Error("Failed to create survey")
  }

  const questions = formData.questions.map((q, index) => ({
    enquete_id: survey.id,
    tipo: q.tipo,
    pergunta: q.pergunta,
    opcoes: q.opcoes,
    obrigatoria: q.obrigatoria,
    ordem: index + 1,
  }))

  const { error: questionsError } = await supabase.from("questoes_enquetes").insert(questions)

  if (questionsError) {
    console.error("[v0] Error creating questions:", questionsError)
    await supabase.from("enquetes").delete().eq("id", survey.id)
    throw new Error("Failed to create survey questions")
  }

  revalidatePath("/client/surveys")
  return { success: true }
}

export async function updateSurveyStatus(id: string, status: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("enquetes").update({ status }).eq("id", id)

  if (error) {
    console.error("[v0] Error updating survey status:", error)
    throw new Error("Failed to update survey")
  }

  revalidatePath("/client/surveys")
  return { success: true }
}

export async function deleteSurvey(id: string) {
  const supabase = await createClient()

  await supabase.from("questoes_enquetes").delete().eq("enquete_id", id)

  const { error } = await supabase.from("enquetes").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting survey:", error)
    throw new Error("Failed to delete survey")
  }

  revalidatePath("/client/surveys")
  return { success: true }
}
