import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createMikrotikClient } from "@/lib/mikrotik"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state") // clienteId
  const error = searchParams.get("error")

  if (error) {
    console.error("[v0] Erro no OAuth:", error)
    return NextResponse.redirect(new URL(`/hotspot/${state}?error=${error}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
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

  let redirectUri = provider.redirect_uri
  if (redirectUri.startsWith("/")) {
    const origin = request.nextUrl.origin
    redirectUri = `${origin}${redirectUri}`
  }

  console.log("[v0] Redirect URI para troca de token:", redirectUri)

  try {
    // Trocar code por access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: provider.client_id,
        client_secret: provider.client_secret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error("[v0] Erro ao trocar code por token:", tokenData)
      return NextResponse.redirect(new URL(`/hotspot/${state}?error=token_exchange_failed`, request.url))
    }

    // Buscar informações do usuário
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const userData = await userResponse.json()

    console.log("[v0] Dados do usuário Google:", userData)

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from("usuarios_social")
      .select("*")
      .eq("provider", "google")
      .eq("provider_user_id", userData.id)
      .single()

    let usuarioSocial
    if (existingUser) {
      // Atualizar usuário existente
      const { data, error: updateError } = await supabase
        .from("usuarios_social")
        .update({
          email: userData.email,
          nome_completo: userData.name,
          foto_perfil: userData.picture,
          dados_adicionais: userData,
          ultima_conexao: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error("[v0] Erro ao atualizar usuário social:", updateError)
        return NextResponse.redirect(new URL(`/hotspot/${state}?error=user_update_failed`, request.url))
      }

      // Incrementar total_conexoes
      await supabase.rpc("increment_total_conexoes", { user_id: existingUser.id })

      usuarioSocial = data
    } else {
      // Criar novo usuário
      const { data, error: insertError } = await supabase
        .from("usuarios_social")
        .insert({
          provider: "google",
          provider_user_id: userData.id,
          email: userData.email,
          nome_completo: userData.name,
          foto_perfil: userData.picture,
          dados_adicionais: userData,
          cliente_id: state,
          primeira_conexao: new Date().toISOString(),
          ultima_conexao: new Date().toISOString(),
          total_conexoes: 1,
        })
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Erro ao criar usuário social:", insertError)
        return NextResponse.redirect(new URL(`/hotspot/${state}?error=user_creation_failed`, request.url))
      }

      usuarioSocial = data
    }

    // Criar sessão Wi-Fi
    await supabase.from("sessoes_wifi").insert({
      usuario_social_id: usuarioSocial.id,
      cliente_id: state,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      inicio: new Date().toISOString(),
    })

    try {
      const mikrotikClient = await createMikrotikClient(state)

      if (mikrotikClient) {
        console.log("[v0] Iniciando login no Mikrotik para usuário:", usuarioSocial.email)

        // Criar/atualizar usuário no Mikrotik
        const username = usuarioSocial.email.split("@")[0] + "_" + usuarioSocial.provider
        const password = usuarioSocial.provider_user_id.substring(0, 16) // Senha baseada no ID do provider

        await mikrotikClient.createHotspotUser({
          username,
          password,
          profile: "default",
          comment: `OAuth ${usuarioSocial.provider} - ${usuarioSocial.nome_completo}`,
        })

        // Fazer login automático
        const macAddress = request.headers.get("x-mac-address") // Se disponível
        await mikrotikClient.loginUser(username, macAddress || undefined)

        console.log("[v0] Login no Mikrotik realizado com sucesso")
      }
    } catch (mikrotikError) {
      console.error("[v0] Erro ao integrar com Mikrotik (não-crítico):", mikrotikError)
      // Não falhar a autenticação se o Mikrotik falhar
    }

    // Redirecionar para página de sucesso
    return NextResponse.redirect(new URL(`/hotspot/${state}/obrigado?user=${usuarioSocial.id}`, request.url))
  } catch (error) {
    console.error("[v0] Erro no callback OAuth:", error)
    return NextResponse.redirect(new URL(`/hotspot/${state}?error=callback_failed`, request.url))
  }
}
