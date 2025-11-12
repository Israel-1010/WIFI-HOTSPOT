"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export interface User {
  id: string
  username: string
  email: string
  nome_completo: string
  role: "admin_geral" | "admin_revenda" | "cliente" | "usuario"
  revenda_id?: string
  cliente_id?: string
  permissoes: Record<string, boolean>
  ativo: boolean
}

export interface Session {
  user: User
  token: string
  expires_at: string
}

// Hash de senha usando SHA-256 (Web Crypto API)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Gerar token aleatório
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function login(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string; session?: Session }> {
  try {
    const supabase = await createClient()
    const passwordHash = await hashPassword(password)

    console.log("[v0] Tentativa de login:", { username, passwordHash })

    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .eq("senha_hash", passwordHash)
      .eq("ativo", true)
      .maybeSingle()

    console.log("[v0] Resultado da busca:", { usuario, userError })

    if (userError || !usuario) {
      // Log de tentativa falha
      await supabase.from("logs_acesso").insert({
        username,
        acao: "login_falhou",
        mensagem: "Credenciais inválidas",
        sucesso: false,
        criado_em: new Date().toISOString(),
      })

      return { success: false, error: "Usuário ou senha inválidos" }
    }

    // Criar sessão
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas

    const { error: sessionError } = await supabase.from("sessoes_usuarios").insert({
      usuario_id: usuario.id,
      token,
      expira_em: expiresAt.toISOString(),
      criado_em: new Date().toISOString(),
    })

    if (sessionError) {
      return { success: false, error: "Erro ao criar sessão" }
    }

    // Atualizar último acesso
    await supabase.from("usuarios").update({ ultimo_acesso: new Date().toISOString() }).eq("id", usuario.id)

    // Log de sucesso
    await supabase.from("logs_acesso").insert({
      usuario_id: usuario.id,
      username: usuario.username,
      acao: "login",
      mensagem: "Login realizado com sucesso",
      sucesso: true,
      criado_em: new Date().toISOString(),
    })

    // Salvar token no cookie
    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
    })

    const session: Session = {
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        role: usuario.role,
        revenda_id: usuario.revenda_id,
        cliente_id: usuario.cliente_id,
        permissoes: usuario.permissoes || {},
        ativo: usuario.ativo,
      },
      token,
      expires_at: expiresAt.toISOString(),
    }

    return { success: true, session }
  } catch (error) {
    console.error("[v0] Erro no login:", error)
    return { success: false, error: "Erro interno do servidor" }
  }
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (token) {
      const supabase = await createClient()

      // Deletar sessão
      await supabase.from("sessoes_usuarios").delete().eq("token", token)
    }

    // Remover cookie
    cookieStore.delete("auth_token")
  } catch (error) {
    console.error("[v0] Erro no logout:", error)
  }
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    console.log("[v0] getSession - token:", token ? "presente" : "ausente")

    if (!token) {
      return null
    }

    const supabase = await createClient()

    const { data: sessao, error: sessionError } = await supabase
      .from("sessoes_usuarios")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    console.log("[v0] getSession - sessão encontrada:", !!sessao, "erro:", sessionError)

    if (sessionError || !sessao) {
      return null
    }

    // Verificar se expirou
    if (new Date(sessao.expira_em) < new Date()) {
      console.log("[v0] getSession - sessão expirada")
      await supabase.from("sessoes_usuarios").delete().eq("token", token)
      cookieStore.delete("auth_token")
      return null
    }

    // Buscar usuário separadamente
    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", sessao.usuario_id)
      .maybeSingle()

    console.log("[v0] getSession - usuário encontrado:", !!usuario, "erro:", userError)

    if (userError || !usuario) {
      return null
    }

    const session: Session = {
      user: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
        nome_completo: usuario.nome_completo,
        role: usuario.role,
        revenda_id: usuario.revenda_id,
        cliente_id: usuario.cliente_id,
        permissoes: usuario.permissoes || {},
        ativo: usuario.ativo,
      },
      token: sessao.token,
      expires_at: sessao.expira_em,
    }

    console.log("[v0] getSession - sessão válida para usuário:", usuario.username, "role:", usuario.role)

    return session
  } catch (error) {
    console.error("[v0] Erro ao buscar sessão:", error)
    return null
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<User> {
  const session = await getSession()

  if (!session) {
    throw new Error("Não autenticado")
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error("Sem permissão")
  }

  return session.user
}
