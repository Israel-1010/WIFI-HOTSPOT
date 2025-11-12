"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPlanos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("preco_mensal", { ascending: true })

  if (error) {
    console.error("Erro ao buscar planos:", error)
    return []
  }

  return data || []
}

export async function getPlanoById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("planos").select("*").eq("id", id).single()

  if (error) {
    console.error("Erro ao buscar plano:", error)
    return null
  }

  return data
}
