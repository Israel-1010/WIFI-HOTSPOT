"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getRevendas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("revendas")
    .select(`
      *,
      configuracoes_whitelabel(*)
    `)
    .order("data_criacao", { ascending: false })

  if (error) throw error
  return data
}

export async function getRevendaById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("revendas")
    .select(`
      *,
      configuracoes_whitelabel(*)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createRevenda(formData: {
  nome: string
  slug: string
  email: string
  telefone?: string
  plano_id?: string
  limite_clientes?: number
  limite_hotspots?: number
  limite_usuarios_simultaneos?: number
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("revendas").insert([formData]).select().single()

  if (error) throw error

  revalidatePath("/admin-geral/revendas")
  return data
}

export async function updateRevenda(
  id: string,
  formData: Partial<{
    nome: string
    slug: string
    email: string
    telefone: string
    status: string
    limite_clientes: number
    limite_hotspots: number
    limite_usuarios_simultaneos: number
    data_expiracao: string
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

export async function updateWhitelabel(
  revenda_id: string,
  formData: {
    logo_url?: string
    favicon_url?: string
    cor_primaria?: string
    cor_secundaria?: string
    cor_acento?: string
    nome_sistema?: string
    slogan?: string
    email_suporte?: string
    telefone_suporte?: string
  },
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("configuracoes_whitelabel")
    .upsert({
      revenda_id,
      ...formData,
      data_atualizacao: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/admin-revenda/whitelabel")
  return data
}

export async function getPlanos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("preco_mensal", { ascending: true })

  if (error) throw error
  return data
}
