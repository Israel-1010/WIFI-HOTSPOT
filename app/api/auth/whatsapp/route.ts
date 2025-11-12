import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clienteId = searchParams.get("client_id")

  if (!clienteId) {
    return NextResponse.json({ error: "client_id é obrigatório" }, { status: 400 })
  }

  const supabase = await createClient()

  // Buscar configuração do WhatsApp OAuth
  const { data: provider } = await supabase
    .from("oauth_providers")
    .select("*")
    .eq("provider", "whatsapp")
    .eq("ativo", true)
    .single()

  if (!provider) {
    return NextResponse.json({ error: "WhatsApp OAuth não configurado" }, { status: 400 })
  }

  // Validar se o provider está completamente configurado
  if (!provider.client_id || !provider.client_secret || !provider.redirect_uri) {
    console.error("[v0] Provider WhatsApp não configurado completamente")

    return NextResponse.json(
      {
        error:
          "WhatsApp OAuth não está configurado. Por favor, configure o Client ID, Client Secret e Redirect URI no Admin Geral.",
        details: "Acesse Admin Geral > Integrações > OAuth Providers para configurar.",
      },
      { status: 400 },
    )
  }

  // Construir URL de autorização do WhatsApp (via Facebook)
  const whatsappAuthUrl = new URL(provider.configuracoes.auth_url)
  whatsappAuthUrl.searchParams.set("client_id", provider.client_id)
  whatsappAuthUrl.searchParams.set("redirect_uri", provider.redirect_uri)
  whatsappAuthUrl.searchParams.set("response_type", "code")
  whatsappAuthUrl.searchParams.set("scope", provider.scopes.join(","))
  whatsappAuthUrl.searchParams.set("state", clienteId)

  console.log("[v0] Redirecionando para WhatsApp OAuth:", whatsappAuthUrl.toString())

  return NextResponse.redirect(whatsappAuthUrl.toString())
}
