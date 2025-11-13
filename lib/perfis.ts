import type { Session } from "@/lib/auth"
import type { SupabaseClient } from "@supabase/supabase-js"

export type PerfilResolution = {
  perfilId: string | null
  candidateIds: string[]
}

function sanitizePayload(payload: Record<string, any>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

function isColumnError(error: { message?: string } | null) {
  if (!error?.message) return false
  const normalized = error.message.toLowerCase()
  return normalized.includes("column") || normalized.includes("does not exist")
}

export async function resolvePerfilIdForUser(
  supabase: SupabaseClient<any, "public", any>,
  user: Session["user"] | null | undefined,
): Promise<PerfilResolution> {
  const candidateIds = new Set<string>()
  if (!user) {
    return { perfilId: null, candidateIds: [] }
  }

  if (user.id) {
    candidateIds.add(user.id)
  }
  if (user.cliente_id) {
    candidateIds.add(user.cliente_id)
  }

  const checkedIds = new Set<string>()

  const lookupPerfilById = async (id?: string | null) => {
    if (!id || checkedIds.has(id)) {
      return null
    }
    checkedIds.add(id)
    const { data, error } = await supabase.from("perfis").select("id").eq("id", id).maybeSingle()
    if (error) {
      console.warn("[v0] Erro ao buscar perfil por id", { id, error })
      return null
    }
    return data?.id ?? null
  }

  let perfilId = await lookupPerfilById(user.id)

  if (!perfilId && user.cliente_id) {
    perfilId = await lookupPerfilById(user.cliente_id)
  }

  if (!perfilId && user.email) {
    const { data, error } = await supabase.from("perfis").select("id").eq("email", user.email).maybeSingle()
    if (error) {
      console.warn("[v0] Erro ao buscar perfil por email", { email: user.email, error })
    } else if (data?.id) {
      perfilId = data.id
    }
  }

  if (perfilId) {
    candidateIds.add(perfilId)
  }

  return { perfilId: perfilId ?? null, candidateIds: Array.from(candidateIds) }
}

function mapRoleToPerfilRole(role?: string | null) {
  if (!role) return "cliente"
  const adminRoles = new Set(["admin", "admin_geral", "admin_revenda", "operador_noc"])
  return adminRoles.has(role) ? "admin" : "cliente"
}

export async function ensurePerfilForUser(
  supabase: SupabaseClient<any, "public", any>,
  user: Session["user"] | null | undefined,
): Promise<PerfilResolution> {
  const baseResolution = await resolvePerfilIdForUser(supabase, user)
  if (!user) {
    return baseResolution
  }

  if (baseResolution.perfilId) {
    return baseResolution
  }

  const fallbackNome = user.nome_completo || user.username || user.email?.split("@")[0] || "Usuário"
  const now = new Date().toISOString()
  const richPayload = sanitizePayload({
    id: user.id,
    nome: fallbackNome,
    email: user.email,
    role: mapRoleToPerfilRole(user.role),
    ativo: true,
    revenda_id: user.revenda_id,
    cliente_id: user.cliente_id,
    tipo_usuario: user.role,
    permissoes: user.permissoes,
    criado_em: now,
    atualizado_em: now,
  })

  const fallbackPayload = sanitizePayload({
    id: user.id,
    nome: fallbackNome,
    email: user.email,
    role: mapRoleToPerfilRole(user.role),
  })

  const payloads = [richPayload, fallbackPayload, { id: user.id }]

  for (const payload of payloads) {
    const { data, error } = await supabase
      .from("perfis")
      .upsert(payload, { onConflict: "id" })
      .select("id")
      .maybeSingle()

    if (!error && data?.id) {
      const candidateIds = new Set(baseResolution.candidateIds)
      candidateIds.add(data.id)
      return { perfilId: data.id, candidateIds: Array.from(candidateIds) }
    }

    if (error && !isColumnError(error)) {
      console.warn("[v0] Erro ao garantir perfil para usuário", { userId: user.id, error })
      return baseResolution
    }
  }

  return baseResolution
}
