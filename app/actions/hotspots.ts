"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getHotspots() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("hotspots")
    .select(`
      *,
      perfis:cliente_id(nome_completo, email)
    `)
    .order("data_criacao", { ascending: false })

  if (error) throw error
  return data
}

export async function getHotspotById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("hotspots")
    .select(`
      *,
      perfis:cliente_id(nome_completo, email)
    `)
    .eq("id", id)
    .single()

  if (error) throw error
  return data
}

export async function createHotspot(formData: {
  nome: string
  localizacao?: string
  endereco?: string
  mikrotik_ip: string
  mikrotik_porta?: number
  mikrotik_usuario: string
  mikrotik_senha: string
}) {
  const supabase = await createClient()

  // Pegar o usuário atual e sua revenda
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Usuário não autenticado")

  const { data: perfil } = await supabase.from("perfis").select("revenda_id").eq("id", user.id).single()

  const { data, error } = await supabase
    .from("hotspots")
    .insert([
      {
        ...formData,
        cliente_id: user.id,
        revenda_id: perfil?.revenda_id,
      },
    ])
    .select()
    .single()

  if (error) throw error

  revalidatePath("/client/hotspots")
  return data
}

export async function updateHotspot(
  id: string,
  formData: Partial<{
    nome: string
    localizacao: string
    endereco: string
    mikrotik_ip: string
    mikrotik_porta: number
    mikrotik_usuario: string
    mikrotik_senha: string
    status: string
  }>,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("hotspots")
    .update({
      ...formData,
      data_atualizacao: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/client/hotspots")
  return data
}

export async function deleteHotspot(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("hotspots").delete().eq("id", id)

  if (error) throw error

  revalidatePath("/client/hotspots")
}
