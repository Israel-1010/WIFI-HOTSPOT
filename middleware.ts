import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get("host") || ""

  console.log("[v0] Middleware - pathname:", pathname)

  const supabase = await createClient()

  // Verificar se é um domínio de revenda
  const { data: revenda } = await supabase
    .from("revendas")
    .select("id, nome, cor_primaria, cor_secundaria, logo_url")
    .eq("dominio", hostname)
    .eq("status", "ativa")
    .maybeSingle()

  // Se for domínio de revenda, adicionar informações no header
  const response = NextResponse.next()
  if (revenda) {
    response.headers.set("x-revenda-id", revenda.id)
    response.headers.set("x-revenda-nome", revenda.nome)
    response.headers.set("x-revenda-cor-primaria", revenda.cor_primaria || "#3b82f6")
    response.headers.set("x-revenda-cor-secundaria", revenda.cor_secundaria || "#1e40af")
    response.headers.set("x-revenda-logo", revenda.logo_url || "")
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ["/auth/login", "/", "/api/auth"]

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log("[v0] Middleware - rota pública, permitindo acesso")
    return response
  }

  // Verificar token de autenticação
  const token = request.cookies.get("auth_token")?.value

  console.log("[v0] Middleware - token:", token ? "presente" : "ausente")

  if (!token) {
    console.log("[v0] Middleware - sem token, redirecionando para login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  try {
    const { data: sessao, error: sessionError } = await supabase
      .from("sessoes_usuarios")
      .select("*")
      .eq("token", token)
      .maybeSingle()

    console.log("[v0] Middleware - sessão encontrada:", !!sessao, "erro:", sessionError?.message)

    if (sessionError || !sessao || new Date(sessao.expira_em) < new Date()) {
      console.log("[v0] Middleware - sessão inválida ou expirada, redirecionando para login")
      const response = NextResponse.redirect(new URL("/auth/login", request.url))
      response.cookies.delete("auth_token")
      return response
    }

    const { data: usuario, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", sessao.usuario_id)
      .maybeSingle()

    if (userError || !usuario) {
      console.log("[v0] Middleware - usuário não encontrado, redirecionando para login")
      const response = NextResponse.redirect(new URL("/auth/login", request.url))
      response.cookies.delete("auth_token")
      return response
    }

    const role = usuario.role

    console.log("[v0] Middleware - usuário autenticado:", usuario.username, "role:", role)

    // Verificar permissões baseado na rota
    if (pathname.startsWith("/admin-geral") && role !== "admin_geral") {
      console.log("[v0] Middleware - sem permissão para admin-geral")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin-geral")) {
      if (role !== "admin_revenda" && role !== "admin_geral") {
        console.log("[v0] Middleware - sem permissão para admin")
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }

    if (pathname.startsWith("/client")) {
      if (!["cliente", "usuario", "admin_revenda", "admin_geral"].includes(role)) {
        console.log("[v0] Middleware - sem permissão para client")
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }
    }

    console.log("[v0] Middleware - acesso permitido")
    return response
  } catch (error) {
    console.error("[v0] Erro no middleware:", error)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/admin-geral/:path*", "/client/:path*"],
}
