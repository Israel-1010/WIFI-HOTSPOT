"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPortalConfig(clienteId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("portal_config").select("*").eq("cliente_id", clienteId).maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Erro ao buscar configuração do portal:", error)
      return { config: null, error: error.message }
    }

    // Se não existe configuração, retorna valores padrão
    if (!data) {
      return {
        config: {
          businessName: "Meu Negócio",
          welcomeMessage: "Bem-vindo ao nosso Wi-Fi!",
          ssid: "WiFi-Gratis",
          brandColor: "#2563eb",
          backgroundColor: "#f8fafc",
          textColor: "#1f2937",
          secondaryTextColor: "#6b7280",
          titleSize: "text-xl",
          cardStyle: "rounded-lg",
          loginMethods: {
            voucher: true,
            facebook: true,
            google: true,
            instagram: false,
            whatsapp: false,
            email: false,
            phone: false,
            userPassword: false,
          },
          termsRequired: true,
          showCampaigns: true,
          campaignTiming: "before",
          showSurveys: true,
          surveyTiming: "after",
        },
        error: null,
      }
    }

    // Converter do formato do banco para o formato do componente
    return {
      config: {
        businessName: data.business_name,
        welcomeMessage: data.welcome_message,
        ssid: data.ssid,
        logoUrl: data.logo_url,
        brandColor: data.brand_color,
        backgroundColor: data.background_color,
        textColor: data.text_color,
        secondaryTextColor: data.secondary_text_color,
        titleSize: data.title_size,
        cardStyle: data.card_style,
        loginMethods: {
          voucher: data.login_voucher,
          facebook: data.login_facebook,
          google: data.login_google,
          instagram: data.login_instagram,
          whatsapp: data.login_whatsapp,
          email: data.login_email,
          phone: data.login_phone,
          userPassword: data.login_user_password,
        },
        termsRequired: data.terms_required,
        showCampaigns: data.show_campaigns,
        campaignTiming: data.campaign_timing,
        showSurveys: data.show_surveys,
        surveyTiming: data.survey_timing,
      },
      error: null,
    }
  } catch (error: any) {
    console.error("[v0] Erro ao buscar configuração do portal:", error)
    return { config: null, error: error.message }
  }
}

export async function savePortalConfig(clienteId: string, config: any) {
  try {
    const supabase = await createClient()

    // Converter do formato do componente para o formato do banco
    const dbConfig = {
      cliente_id: clienteId,
      business_name: config.businessName,
      welcome_message: config.welcomeMessage,
      ssid: config.ssid,
      logo_url: config.logoUrl,
      brand_color: config.brandColor,
      background_color: config.backgroundColor,
      text_color: config.textColor,
      secondary_text_color: config.secondaryTextColor,
      title_size: config.titleSize,
      card_style: config.cardStyle,
      login_voucher: config.loginMethods.voucher,
      login_facebook: config.loginMethods.facebook,
      login_google: config.loginMethods.google,
      login_instagram: config.loginMethods.instagram,
      login_whatsapp: config.loginMethods.whatsapp,
      login_email: config.loginMethods.email,
      login_phone: config.loginMethods.phone,
      login_user_password: config.loginMethods.userPassword,
      terms_required: config.termsRequired,
      show_campaigns: config.showCampaigns,
      campaign_timing: config.campaignTiming,
      show_surveys: config.showSurveys,
      survey_timing: config.surveyTiming,
    }

    const { data, error } = await supabase
      .from("portal_config")
      .upsert(dbConfig, {
        onConflict: "cliente_id",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Erro ao salvar configuração do portal:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Configuração do portal salva com sucesso")
    return { success: true, error: null }
  } catch (error: any) {
    console.error("[v0] Erro ao salvar configuração do portal:", error)
    return { success: false, error: error.message }
  }
}
