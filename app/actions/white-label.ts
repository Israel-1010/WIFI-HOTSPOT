"use server"

import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/auth"

export interface WhiteLabelConfig {
  id: string
  nome: string
  dominio: string | null
  logo_url: string | null
  favicon_url: string | null
  cor_primaria: string | null
  cor_secundaria: string | null
  cor_fundo: string | null
  cor_header: string | null
  cor_sidebar: string | null
  cor_texto: string | null
  fonte_primaria: string | null
  fonte_secundaria: string | null
  estilo_botao: string | null
  tema_escuro: boolean | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  email: string | null
  telefone: string | null
  cnpj: string | null
}

export async function getWhiteLabelConfig(revendaId?: string): Promise<WhiteLabelConfig | null> {
  const supabase = await createClient()

  if (!revendaId) {
    const session = await getSession()
    if (session?.user?.revenda_id) {
      revendaId = session.user.revenda_id
    }
  }

  // Se ainda não tem revendaId, busca a primeira ativa
  if (!revendaId) {
    const { data, error } = await supabase.from("revendas").select("*").eq("status", "ativa").limit(1).maybeSingle()

    if (!data) {
      return null
    }
    return data
  }

  const { data, error } = await supabase.from("revendas").select("*").eq("id", revendaId).maybeSingle()

  if (error || !data) {
    console.error("[v0] Erro ao buscar white label:", error)
    return null
  }

  console.log("[v0] White label carregado:", data)
  return data
}

export async function updateWhiteLabelConfig(revendaId: string, config: Partial<Omit<WhiteLabelConfig, "id">>) {
  const supabase = await createClient()

  console.log("[v0] Atualizando white label:", { revendaId, config })

  const { data, error } = await supabase
    .from("revendas")
    .update({
      ...config,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", revendaId)
    .select()
    .maybeSingle()

  if (error) {
    console.error("[v0] Erro ao atualizar white label:", error)
    throw new Error(`Erro ao atualizar configurações: ${error.message}`)
  }

  console.log("[v0] White label atualizado com sucesso:", data)
  return data
}

export async function uploadLogo(revendaId: string, file: File) {
  const supabase = await createClient()

  // Gera nome único para o arquivo
  const fileExt = file.name.split(".").pop()
  const fileName = `${revendaId}-${Date.now()}.${fileExt}`
  const filePath = `logos/${fileName}`

  // Upload para o Supabase Storage (se configurado)
  // Por enquanto, retorna uma URL placeholder
  // TODO: Implementar upload real quando o Storage estiver configurado

  return `/placeholder.svg?height=100&width=200&query=logo+${revendaId}`
}
