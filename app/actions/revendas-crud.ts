"use server"

import { createHash } from "node:crypto"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

function hashPassword(plain: string) {
  return createHash("sha256").update(plain).digest("hex")
}

async function fetchRevendaWithExtras(supabase: SupabaseServerClient, id: string) {
  const { data: revenda, error: revendaError } = await supabase
    .from("revendas")
    .select(`
      *,
      plano:planos(nome, preco_mensal)
    `)
    .eq("id", id)
    .maybeSingle()

  if (revendaError) {
    console.error("[v0] Erro ao buscar revenda atualizada:", revendaError)
    return null
  }

  if (!revenda) {
    return null
  }

  const [adminUserResult, clientesCountResult] = await Promise.all([
    supabase
      .from("usuarios")
      .select("username, email, telefone, senha_hash")
      .eq("revenda_id", id)
      .eq("role", "admin_revenda")
      .maybeSingle(),
    supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("revenda_id", id)
      .eq("role", "cliente"),
  ])

  if (adminUserResult.error) {
    console.error("[v0] Erro ao buscar usuário admin da revenda:", adminUserResult.error)
  }

  if (clientesCountResult.error) {
    console.error("[v0] Erro ao contar clientes da revenda:", clientesCountResult.error)
  }

  return {
    ...revenda,
    total_clientes: clientesCountResult.count || 0,
    username: adminUserResult.data?.username ?? null,
    email: revenda.email || adminUserResult.data?.email || null,
    telefone: revenda.telefone || adminUserResult.data?.telefone || null,
    senha_hash: adminUserResult.data?.senha_hash ?? null,
  }
}

export interface RevendaFormData {
  nome: string
  cnpj: string
  email: string
  telefone: string
  dominio: string
  username: string
  senha: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  plano_id: string
  logo_url?: string
  cor_primaria?: string
  cor_secundaria?: string
  limite_clientes?: number
  limite_hotspots?: number
  limite_usuarios_simultaneos?: number
}

export interface ClienteFormData {
  nome_completo: string
  empresa: string
  cnpj: string
  email: string
  telefone: string
  username: string
  senha: string
  endereco?: string
  revenda_id: string
}

// ============= REVENDAS (Admin Geral) =============

export async function getRevendas() {
  const supabase = await createClient()

  const { data: revendas, error } = await supabase
    .from("revendas")
    .select(`
      *,
      plano:planos(nome, preco_mensal)
    `)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar revendas:", error)
    return []
  }

  // Buscar contagem de clientes para cada revenda
  const revendasComContagem = await Promise.all(
    (revendas || []).map(async (revenda) => {
      const [{ count }, { data: adminUser }] = await Promise.all([
        supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true })
          .eq("revenda_id", revenda.id)
          .eq("role", "cliente"),
        supabase
          .from("usuarios")
          .select("id, username, email, telefone, senha_hash")
          .eq("revenda_id", revenda.id)
          .eq("role", "admin_revenda")
          .maybeSingle(),
      ])

      return {
        ...revenda,
        total_clientes: count || 0,
        username: adminUser?.username || null,
        email: revenda.email || adminUser?.email || null,
        telefone: revenda.telefone || adminUser?.telefone || null,
        senha_hash: adminUser?.senha_hash || null,
      }
    }),
  )

  return revendasComContagem
}

export async function createRevenda(data: RevendaFormData) {
  const supabase = await createClient()

  // Validar CNPJ único
  const { data: existente } = await supabase.from("revendas").select("id").eq("cnpj", data.cnpj).maybeSingle()

  if (existente) {
    return { success: false, error: "CNPJ já cadastrado" }
  }

  // Validar domínio único
  const { data: dominioExistente } = await supabase
    .from("revendas")
    .select("id")
    .eq("dominio", data.dominio)
    .maybeSingle()

  if (dominioExistente) {
    return { success: false, error: "Domínio já cadastrado" }
  }

  const { data: usernameExistente } = await supabase
    .from("usuarios")
    .select("id")
    .eq("username", data.username)
    .maybeSingle()

  if (usernameExistente) {
    return { success: false, error: "Nome de usuário já existe" }
  }

  const { data: revenda, error } = await supabase
    .from("revendas")
    .insert({
      nome: data.nome,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      dominio: data.dominio,
      plano_id: data.plano_id,
      logo_url: data.logo_url,
      cor_primaria: data.cor_primaria || "#3b82f6",
      cor_secundaria: data.cor_secundaria || "#1e40af",
      limite_clientes: data.limite_clientes,
      limite_hotspots: data.limite_hotspots,
      limite_usuarios_simultaneos: data.limite_usuarios_simultaneos,
      status: "ativa",
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar revenda:", error)
    return { success: false, error: error.message }
  }

  const senha_hash = hashPassword(data.senha)

  const { error: userError } = await supabase.from("usuarios").insert({
    username: data.username,
    senha_hash,
    email: data.email,
    nome_completo: data.nome,
    telefone: data.telefone,
    cnpj: data.cnpj,
    role: "admin_revenda",
    revenda_id: revenda.id,
    ativo: true,
  })

  if (userError) {
    console.error("[v0] Erro ao criar usuário da revenda:", userError)
    // Rollback: deletar revenda criada
    await supabase.from("revendas").delete().eq("id", revenda.id)
    return { success: false, error: "Erro ao criar usuário de acesso: " + userError.message }
  }

  const revendaAtualizada = await fetchRevendaWithExtras(supabase, revenda.id)

  revalidatePath("/admin-geral/revendas")
  return { success: true, data: revendaAtualizada ?? revenda }
}

export async function updateRevenda(id: string, data: Partial<RevendaFormData>) {
  const supabase = await createClient()

  const { senha, username, ...rest } = data

  const revendaData = Object.fromEntries(
    Object.entries({
      ...rest,
      atualizado_em: new Date().toISOString(),
    }).filter(([, value]) => value !== undefined),
  )

  const { error } = await supabase
    .from("revendas")
    .update(revendaData)
    .eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar revenda:", error)
    return { success: false, error: error.message }
  }

  if (senha || username || rest.email || rest.telefone) {
    const { data: adminUser, error: adminUserError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("revenda_id", id)
      .eq("role", "admin_revenda")
      .maybeSingle()

    if (adminUserError) {
      console.error("[v0] Erro ao buscar admin da revenda:", adminUserError)
      return { success: false, error: adminUserError.message }
    }

    if (adminUser?.id) {
      const userUpdate: Record<string, unknown> = {}

      if (username) {
        userUpdate.username = username
      }

      if (rest.email) {
        userUpdate.email = rest.email
      }

      if (rest.telefone) {
        userUpdate.telefone = rest.telefone
      }

      if (senha) {
        userUpdate.senha_hash = hashPassword(senha)
      }

      if (Object.keys(userUpdate).length > 0) {
        const { error: userError } = await supabase.from("usuarios").update(userUpdate).eq("id", adminUser.id)

        if (userError) {
          console.error("[v0] Erro ao atualizar usuário admin da revenda:", userError)
          return { success: false, error: userError.message }
        }
      }
    }
  }

  const revendaAtualizada = await fetchRevendaWithExtras(supabase, id)

  revalidatePath("/admin-geral/revendas")
  return { success: true, data: revendaAtualizada }
}

export async function deleteRevenda(id: string) {
  const supabase = await createClient()

  // Verificar se há clientes vinculados
  const { count } = await supabase.from("usuarios").select("*", { count: "exact", head: true }).eq("revenda_id", id)

  if (count && count > 0) {
    return { success: false, error: "Não é possível excluir revenda com clientes vinculados" }
  }

  const { error } = await supabase.from("revendas").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao excluir revenda:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin-geral/revendas")
  return { success: true }
}

// ============= CLIENTES (Revenda) =============

export async function getClientesByRevenda(revendaId: string) {
  const supabase = await createClient()

  const { data: clientes, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("revenda_id", revendaId)
    .eq("role", "cliente")
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[v0] Erro ao buscar clientes:", error)
    return []
  }

  return clientes || []
}

export async function createCliente(data: ClienteFormData & { plano_id?: string }) {
  const supabase = await createClient()

  console.log("[v0] Criando cliente:", { username: data.username, email: data.email, cnpj: data.cnpj })

  const { data: existente } = await supabase.from("usuarios").select("id").eq("username", data.username).maybeSingle()

  if (existente) {
    console.log("[v0] Erro: Username já existe")
    return { success: false, error: "Nome de usuário já existe" }
  }

  const { data: emailExistente } = await supabase.from("usuarios").select("id").eq("email", data.email).maybeSingle()

  if (emailExistente) {
    console.log("[v0] Erro: Email já existe")
    return { success: false, error: "Email já cadastrado no sistema" }
  }

  if (data.cnpj) {
    const { data: cnpjExistente } = await supabase.from("usuarios").select("id").eq("cnpj", data.cnpj).maybeSingle()

    if (cnpjExistente) {
      console.log("[v0] Erro: CNPJ já existe")
      return { success: false, error: "CNPJ já cadastrado" }
    }
  }

  console.log("[v0] Buscando configurações da revenda:", data.revenda_id)
  const { data: revenda } = await supabase
    .from("revendas")
    .select("cor_primaria, cor_secundaria, logo_url")
    .eq("id", data.revenda_id)
    .single()

  console.log("[v0] Configurações da revenda:", revenda)

  // Hash da senha usando SHA-256
  const encoder = new TextEncoder()
  const data_senha = encoder.encode(data.senha)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data_senha)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const senha_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  const { data: cliente, error } = await supabase
    .from("usuarios")
    .insert({
      nome_completo: data.nome_completo,
      empresa: data.empresa,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      username: data.username,
      senha_hash,
      endereco: data.endereco,
      revenda_id: data.revenda_id,
      plano_id: data.plano_id,
      role: "cliente",
      ativo: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[v0] Erro ao criar cliente:", error)
    return { success: false, error: "Erro ao criar cliente: " + error.message }
  }

  console.log("[v0] Cliente criado com sucesso:", cliente.id)

  if (revenda) {
    console.log("[v0] Criando configuração de portal com white label herdado")
    const { error: portalError } = await supabase.from("configuracoes_portal").insert({
      cliente_id: cliente.id,
      cor_primaria: revenda.cor_primaria,
      cor_secundaria: revenda.cor_secundaria,
      logo_url: revenda.logo_url,
      slideshow_ativo: true,
      slideshow_tempo_minimo: 30,
      anuncios_obrigatorios: true,
      anuncios_por_sessao: 3,
      auth_social_ativo: true,
      auth_email_ativo: true,
      auth_voucher_ativo: false,
    })

    if (portalError) {
      console.error("[v0] Erro ao criar configuração de portal:", portalError)
    } else {
      console.log("[v0] Configuração de portal criada com sucesso")
    }
  }

  revalidatePath("/admin/clientes")
  return { success: true, data: cliente }
}

export async function updateCliente(id: string, data: Partial<ClienteFormData>) {
  const supabase = await createClient()

  const updateData: any = {
    nome_completo: data.nome_completo,
    empresa: data.empresa,
    cnpj: data.cnpj,
    email: data.email,
    telefone: data.telefone,
    endereco: data.endereco,
    atualizado_em: new Date().toISOString(),
  }

  // Se senha foi fornecida, atualizar hash
  if (data.senha) {
    const encoder = new TextEncoder()
    const data_senha = encoder.encode(data.senha)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data_senha)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    updateData.senha_hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const { error } = await supabase.from("usuarios").update(updateData).eq("id", id)

  if (error) {
    console.error("[v0] Erro ao atualizar cliente:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/clientes")
  return { success: true }
}

export async function deleteCliente(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("usuarios").delete().eq("id", id)

  if (error) {
    console.error("[v0] Erro ao excluir cliente:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/clientes")
  return { success: true }
}

export async function getPlanos() {
  const supabase = await createClient()

  const { data: planos, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("preco_mensal", { ascending: true })

  if (error) {
    console.error("[v0] Erro ao buscar planos:", error)
    return []
  }

  return planos || []
}

export { getClientesByRevenda as getClientes }
