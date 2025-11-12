import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clienteId = searchParams.get("client_id")

  if (!clienteId) {
    return NextResponse.json({ error: "client_id é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()

  // Buscar configuração do Google OAuth
  const { data: provider } = await supabase
    .from("oauth_providers")
    .select("*")
    .eq("provider", "google")
    .eq("ativo", true)
    .single()

  if (!provider) {
    return NextResponse.json({ error: "Google OAuth não configurado" }, { status: 400 })
  }

  if (!provider.client_id || !provider.client_secret || !provider.redirect_uri) {
    console.error("[v0] Provider Google não configurado completamente:", {
      has_client_id: !!provider.client_id,
      has_client_secret: !!provider.client_secret,
      has_redirect_uri: !!provider.redirect_uri,
    })

    return NextResponse.json(
      {
        error:
          "Google OAuth não está configurado. Por favor, configure o Client ID, Client Secret e Redirect URI no Admin Geral.",
        details: "Acesse Admin Geral > Integrações > OAuth Providers para configurar.",
      },
      { status: 400 },
    )
  }

  // Se redirect_uri for um caminho relativo, construir URL completa com o domínio da requisição
  let redirectUri = provider.redirect_uri
  if (redirectUri.startsWith("/")) {
    const origin = request.nextUrl.origin
    redirectUri = `${origin}${redirectUri}`
  }

  console.log("[v0] Redirect URI construída:", redirectUri)

  // Construir URL de autorização do Google
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  googleAuthUrl.searchParams.set("client_id", provider.client_id)
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri)
  googleAuthUrl.searchParams.set("response_type", "code")
  googleAuthUrl.searchParams.set("scope", provider.scopes.join(" "))
  googleAuthUrl.searchParams.set("state", clienteId) // Passar clienteId no state
  googleAuthUrl.searchParams.set("access_type", "offline") // Solicitar refresh token
  googleAuthUrl.searchParams.set("prompt", "consent") // Forçar tela de consentimento

  console.log("[v0] Redirecionando para Google OAuth:", googleAuthUrl.toString())

  return NextResponse.redirect(googleAuthUrl.toString())
}
