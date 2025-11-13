import type { Session } from "@/lib/auth"
import type { SupabaseClient } from "@supabase/supabase-js"

export type PerfilResolution = {
  perfilId: string | null
  candidateIds: string[]
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
