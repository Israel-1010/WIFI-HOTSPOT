"use server"

import { createClient } from "@/lib/supabase/server"

export async function getEquipeRevenda(revendaId: string) {
  try {
    const supabase = await createClient()

    const { data: equipe, error } = await supabase
      .from("equipe_revenda")
      .select("*")
      .eq("revenda_id", revendaId)
      .order("criado_em", { ascending: false })

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.log("[v0] Tabela equipe_revenda não existe. Execute o script 021 ou 022.")
        return []
      }
      console.error("[v0] Erro ao buscar equipe:", error)
      return []
    }

    return equipe || []
  } catch (error) {
    console.error("[v0] Erro inesperado ao buscar equipe:", error)
    return []
  }
}

export async function createMembroEquipe(data: {
  revendaId: string
  nome: string
  email: string
  senha: string
  papel: string
  permissoes: string[]
}) {
  try {
    const supabase = await createClient()

    const encoder = new TextEncoder()
    const dataSenha = encoder.encode(data.senha)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataSenha)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const senhaHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    const { data: membro, error } = await supabase
      .from("equipe_revenda")
      .insert({
        revenda_id: data.revendaId,
        nome: data.nome,
        email: data.email,
        senha_hash: senhaHash,
        papel: data.papel,
        permissoes: data.permissoes,
        ativo: true,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        console.error("[v0] Tabela equipe_revenda não existe. Execute o script 021 ou 022.")
        throw new Error("Tabela não encontrada. Execute o script SQL 021 ou 022 primeiro.")
      }
      console.error("[v0] Erro ao criar membro:", error)
      throw error
    }

    return membro
  } catch (error) {
    console.error("[v0] Erro inesperado ao criar membro:", error)
    throw error
  }
}

export { getEquipeRevenda as getEquipe }
