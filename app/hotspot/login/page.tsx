"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, AlertCircle, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { mikrotikAPI } from "@/lib/mikrotik-api"
import { saveSurveyResponse } from "@/app/actions/survey-responses"
import { logAuthentication } from "@/app/actions/auth-logs"

interface ClientConfig {
  businessName: string
  welcomeMessage: string
  brandColor: string
  backgroundColor: string
  textColor: string
  secondaryTextColor: string
  titleSize: string
  cardStyle: string
  ssid: string
  loginMethods: {
    voucher: boolean
    facebook: boolean
    google: boolean
    email: boolean
    phone: boolean
    instagram: boolean
    whatsapp: boolean
    userPassword: boolean
  }
  termsRequired: boolean
  showCampaigns: boolean
  showSurveys: boolean
  campaignTiming: "before" | "after"
  surveyTiming: "before" | "after"
  campaigns: Array<{
    id: number
    title: string
    description: string
    image: string
    color: string
    buttonText: string
    targetUrl: string
  }>
  surveys: Array<{
    id: number
    title: string
    questions: Array<{
      type: "rating" | "multiple" | "text"
      question: string
      options?: any[]
    }>
  }>
}

export default function HotspotLoginPage() {
  const searchParams = useSearchParams()
  const clientKey = searchParams.get("key")

  const [clientConfig, setClientConfig] = useState<ClientConfig | null>(null)
  const [isValidKey, setIsValidKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentCampaign, setCurrentCampaign] = useState(0)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [voucherCode, setVoucherCode] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyStep, setSurveyStep] = useState(0)
  const [surveyAnswers, setSurveyAnswers] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (clientKey) {
      validateClientKey(clientKey)
    } else {
      setIsLoading(false)
    }
  }, [clientKey])

  // Auto-rotate campanhas
  useEffect(() => {
    if (clientConfig?.campaigns && clientConfig.campaigns.length > 1) {
      const interval = setInterval(() => {
        setCurrentCampaign((prev) => (prev + 1) % clientConfig.campaigns.length)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [clientConfig?.campaigns])

  const validateClientKey = async (key: string) => {
    try {
      const validConfigs: Record<string, ClientConfig> = {
        "demo-client-123": {
          businessName: "Café Central",
          welcomeMessage: "Bem-vindo ao Wi-Fi do Café Central!",
          brandColor: "#2563eb",
          backgroundColor: "#f8fafc",
          textColor: "#1f2937",
          secondaryTextColor: "#6b7280",
          titleSize: "text-2xl",
          cardStyle: "rounded-xl",
          ssid: "Cafe-Central-WiFi",
          loginMethods: {
            voucher: true,
            facebook: true,
            google: true,
            email: false,
            phone: false,
            instagram: false,
            whatsapp: false,
            userPassword: true,
          },
          termsRequired: true,
          showCampaigns: true,
          showSurveys: true,
          campaignTiming: "before",
          surveyTiming: "after",
          campaigns: [
            {
              id: 1,
              title: "Black Friday 50% OFF",
              description: "Aproveite nossa super promoção de Black Friday!",
              image: "🛍️",
              color: "#dc2626",
              buttonText: "Ver Ofertas",
              targetUrl: "https://minhaloja.com/blackfriday",
            },
            {
              id: 2,
              title: "Cadastre-se e Ganhe",
              description: "10% de desconto na primeira compra",
              image: "🎁",
              color: "#059669",
              buttonText: "Cadastrar",
              targetUrl: "https://minhaloja.com/newsletter",
            },
            {
              id: 3,
              title: "Avalie-nos",
              description: "Sua opinião é muito importante para nós",
              image: "⭐",
              color: "#7c3aed",
              buttonText: "Avaliar",
              targetUrl: "https://minhaloja.com/avaliar",
            },
          ],
          surveys: [
            {
              id: 1,
              title: "Como foi sua experiência?",
              questions: [
                {
                  type: "rating",
                  question: "Como você avalia nosso atendimento?",
                  options: [1, 2, 3, 4, 5],
                },
                {
                  type: "multiple",
                  question: "O que mais gostou?",
                  options: ["Ambiente", "Comida", "Atendimento", "Preço"],
                },
              ],
            },
          ],
        },
      }

      const config = validConfigs[key]
      if (config) {
        setClientConfig(config)
        setIsValidKey(true)
      }
    } catch (error) {
      console.error("Erro ao validar chave:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    setError("")

    try {
      let authSuccess = false
      let loginType: any = "voucher"
      let userName = ""
      let userEmail = ""
      let userPhone = ""

      if (clientConfig?.loginMethods.voucher && voucherCode) {
        loginType = "voucher"
        userName = voucherCode
        authSuccess = await mikrotikAPI.authenticateUser(voucherCode, voucherCode)
        if (!authSuccess) {
          await logAuthentication({
            login_type: loginType,
            user_name: userName,
            success: false,
            error_message: "Invalid or expired voucher code",
          })
          setError("Código de voucher inválido ou expirado")
          return
        }
      } else if (clientConfig?.loginMethods.userPassword && username && password) {
        loginType = "username_password"
        userName = username
        authSuccess = await mikrotikAPI.authenticateUser(username, password)
        if (!authSuccess) {
          await logAuthentication({
            login_type: loginType,
            user_name: userName,
            success: false,
            error_message: "Invalid username or password",
          })
          setError("Usuário ou senha incorretos")
          return
        }
      } else if (email) {
        loginType = "email"
        userEmail = email
        userName = email
        await new Promise((resolve) => setTimeout(resolve, 2000))
        authSuccess = true
      } else if (phone) {
        loginType = "phone"
        userPhone = phone
        userName = phone
        await new Promise((resolve) => setTimeout(resolve, 2000))
        authSuccess = true
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        authSuccess = true
      }

      if (authSuccess) {
        await logAuthentication({
          login_type: loginType,
          user_name: userName,
          user_email: userEmail,
          user_phone: userPhone,
          success: true,
          additional_data: {
            business_name: clientConfig?.businessName,
            ssid: clientConfig?.ssid,
            client_key: clientKey,
          },
        })

        setUserInfo({
          name: userName,
          email: userEmail,
          phone: userPhone,
        })

        setIsConnected(true)

        if (clientConfig?.showSurveys && clientConfig.surveyTiming === "after") {
          setTimeout(() => setShowSurvey(true), 1000)
        } else {
          setTimeout(() => {
            window.location.href = "https://google.com"
          }, 2000)
        }
      }
    } catch (error) {
      console.error("[v0] Connection error:", error)
      setError("Erro ao conectar. Tente novamente.")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setIsConnecting(true)

    await logAuthentication({
      login_type: provider as any,
      user_name: `${provider}_user`,
      success: true,
      additional_data: {
        business_name: clientConfig?.businessName,
        ssid: clientConfig?.ssid,
        client_key: clientKey,
      },
    })

    setTimeout(() => {
      handleConnect()
    }, 1000)
  }

  const handleCampaignClick = (campaign: any) => {
    if (campaign.targetUrl) {
      window.open(campaign.targetUrl, "_blank")
    }
  }

  const nextCampaign = () => {
    if (clientConfig?.campaigns) {
      setCurrentCampaign((prev) => (prev + 1) % clientConfig.campaigns.length)
    }
  }

  const prevCampaign = () => {
    if (clientConfig?.campaigns) {
      setCurrentCampaign((prev) => (prev - 1 + clientConfig.campaigns.length) % clientConfig.campaigns.length)
    }
  }

  const handleSurveyAnswer = async (answer: any) => {
    const newAnswers = [...surveyAnswers]
    newAnswers[surveyStep] = answer
    setSurveyAnswers(newAnswers)

    if (surveyStep < (clientConfig?.surveys[0]?.questions.length || 0) - 1) {
      setSurveyStep(surveyStep + 1)
    } else {
      if (clientConfig?.surveys[0]) {
        const surveyId = clientConfig.surveys[0].id.toString()
        const guestIdentifier = userInfo.email || userInfo.phone || userInfo.name || `guest_${Date.now()}`

        await saveSurveyResponse({
          survey_id: surveyId,
          guest_identifier: guestIdentifier,
          responses: newAnswers,
          user_info: {
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
          },
        })

        console.log("[v0] Survey response saved to database")
      }

      setShowSurvey(false)
      setSurveyStep(0)
      setSurveyAnswers([])

      setTimeout(() => {
        window.location.href = "https://google.com"
      }, 1000)
    }
  }

  const SocialIcon = ({ provider }: { provider: string }) => {
    switch (provider) {
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )
      case "facebook":
        return (
          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )
      case "instagram":
        return (
          <svg className="w-5 h-5" fill="url(#instagram-gradient)" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#833ab4" />
                <stop offset="50%" stopColor="#fd1d1d" />
                <stop offset="100%" stopColor="#fcb045" />
              </linearGradient>
            </defs>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.057-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.073-1.689-.073-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        )
      case "whatsapp":
        return (
          <svg className="w-5 h-5" fill="#25D366" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
          </svg>
        )
      default:
        return <span className="text-lg">📧</span>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando portal...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!clientKey || !isValidKey || !clientConfig) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado</h2>
            <p className="text-gray-600">
              {!clientKey ? "Chave de cliente não fornecida na URL" : "Chave de cliente inválida ou expirada"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasAnyLoginMethod = Object.values(clientConfig.loginMethods).some((method) => method)

  // Tela de sucesso após conexão
  if (isConnected && !showSurvey) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: clientConfig.backgroundColor }}
      >
        <Card className={`w-full max-w-md ${clientConfig.cardStyle} shadow-2xl border-0`}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div
                className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4`}
                style={{ backgroundColor: clientConfig.brandColor }}
              >
                <span className="text-white text-3xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: clientConfig.textColor }}>
                Conectado com Sucesso!
              </h2>
              <p className="text-sm" style={{ color: clientConfig.secondaryTextColor }}>
                Você está conectado ao Wi-Fi {clientConfig.ssid}
              </p>
            </div>

            {/* Campanhas após login */}
            {clientConfig.showCampaigns && clientConfig.campaignTiming === "after" && clientConfig.campaigns && (
              <div className="mb-6">
                <div
                  className={`relative h-24 ${clientConfig.cardStyle} p-4 text-white flex items-center justify-between overflow-hidden cursor-pointer transition-all hover:shadow-lg`}
                  style={{ backgroundColor: clientConfig.campaigns[currentCampaign].color }}
                  onClick={() => handleCampaignClick(clientConfig.campaigns[currentCampaign])}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{clientConfig.campaigns[currentCampaign].title}</h3>
                    <p className="text-xs opacity-90">{clientConfig.campaigns[currentCampaign].description}</p>
                  </div>
                  <div className="text-2xl">{clientConfig.campaigns[currentCampaign].image}</div>
                </div>
              </div>
            )}

            <p className="text-xs" style={{ color: clientConfig.secondaryTextColor }}>
              Redirecionando em alguns segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: clientConfig.backgroundColor }}
    >
      <div className="w-full max-w-md space-y-4">
        {/* Carrossel de Campanhas - ANTES do login */}
        {clientConfig.showCampaigns && clientConfig.campaignTiming === "before" && clientConfig.campaigns && (
          <div className="relative">
            <div
              className={`relative h-32 ${clientConfig.cardStyle} p-6 text-white flex items-center justify-between overflow-hidden cursor-pointer transition-all hover:shadow-lg`}
              style={{ backgroundColor: clientConfig.campaigns[currentCampaign].color }}
              onClick={() => handleCampaignClick(clientConfig.campaigns[currentCampaign])}
            >
              <div className="flex-1 pr-4">
                <h3 className="font-bold text-lg mb-1">{clientConfig.campaigns[currentCampaign].title}</h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {clientConfig.campaigns[currentCampaign].description}
                </p>
              </div>
              <div className="text-4xl">{clientConfig.campaigns[currentCampaign].image}</div>

              {/* Controles de navegação */}
              {clientConfig.campaigns.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prevCampaign()
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextCampaign()
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/20 hover:bg-black/40 rounded-full p-1 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Indicadores */}
              {clientConfig.campaigns.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {clientConfig.campaigns.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentCampaign(index)
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentCampaign ? "bg-white scale-125" : "bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enquete - ANTES do login */}
        {clientConfig.showSurveys && clientConfig.surveyTiming === "before" && !showSurvey && (
          <div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sm">📋 Pesquisa Rápida</h3>
                  <p className="text-xs opacity-90">Responda nossa enquete em 30 segundos</p>
                </div>
                <button
                  onClick={() => setShowSurvey(true)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                >
                  Responder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal da Enquete */}
        {showSurvey && clientConfig.surveys && clientConfig.surveys[0] && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{clientConfig.surveys[0].title}</h3>
                <p className="text-sm text-gray-600">
                  Pergunta {surveyStep + 1} de {clientConfig.surveys[0].questions.length}
                </p>
              </div>

              <div className="mb-6">
                <p className="font-medium mb-3">{clientConfig.surveys[0].questions[surveyStep].question}</p>

                {clientConfig.surveys[0].questions[surveyStep].type === "rating" && (
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleSurveyAnswer(rating)}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-yellow-400 hover:bg-yellow-50 flex items-center justify-center font-bold transition-colors"
                      >
                        <Star className={`h-5 w-5 ${rating <= 3 ? "text-gray-400" : "text-yellow-400"}`} />
                      </button>
                    ))}
                  </div>
                )}

                {clientConfig.surveys[0].questions[surveyStep].type === "multiple" && (
                  <div className="space-y-2">
                    {clientConfig.surveys[0].questions[surveyStep].options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleSurveyAnswer(option)}
                        className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowSurvey(false)
                    setSurveyStep(0)
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Pular
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card de Login */}
        <Card className={`${clientConfig.cardStyle} shadow-2xl border-0`}>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div
                className={`p-4 ${clientConfig.cardStyle} shadow-lg`}
                style={{ backgroundColor: clientConfig.brandColor }}
              >
                <Wifi className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className={`${clientConfig.titleSize} font-bold`} style={{ color: clientConfig.textColor }}>
              {clientConfig.businessName}
            </CardTitle>
            <p className="text-sm mt-2" style={{ color: clientConfig.secondaryTextColor }}>
              {clientConfig.welcomeMessage}
            </p>
            <div
              className="flex justify-center space-x-6 text-xs mt-3"
              style={{ color: clientConfig.secondaryTextColor }}
            >
              <div className="flex items-center space-x-1">
                <span>📶</span>
                <span>100 Mbps</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>Ilimitado</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!hasAnyLoginMethod && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Nenhum método de login configurado.</AlertDescription>
              </Alert>
            )}

            {/* Métodos de Login */}
            <div className="space-y-4">
              {/* Voucher */}
              {clientConfig.loginMethods.voucher && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="voucher" className="text-sm font-medium">
                      Código do Voucher
                    </Label>
                    <Input
                      id="voucher"
                      placeholder="Digite seu código"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className={`text-center text-lg font-mono ${clientConfig.cardStyle} border-2 focus:border-opacity-100`}
                      style={{ borderColor: clientConfig.brandColor + "40" }}
                    />
                  </div>
                </div>
              )}

              {/* Usuário e Senha */}
              {clientConfig.loginMethods.userPassword && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Usuário
                    </Label>
                    <Input
                      id="username"
                      placeholder="Digite seu usuário"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`${clientConfig.cardStyle} border-2`}
                      style={{ borderColor: clientConfig.brandColor + "40" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${clientConfig.cardStyle} border-2`}
                      style={{ borderColor: clientConfig.brandColor + "40" }}
                    />
                  </div>
                </div>
              )}

              {/* Divisor */}
              {(clientConfig.loginMethods.facebook ||
                clientConfig.loginMethods.google ||
                clientConfig.loginMethods.email ||
                clientConfig.loginMethods.phone ||
                clientConfig.loginMethods.instagram ||
                clientConfig.loginMethods.whatsapp) &&
                (clientConfig.loginMethods.voucher || clientConfig.loginMethods.userPassword) && (
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-sm text-gray-500 bg-white font-medium">ou conecte-se com</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                )}

              {/* Login Social e Outros */}
              <div className="space-y-3">
                {clientConfig.loginMethods.facebook && (
                  <Button
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={isConnecting}
                    className={`w-full bg-[#1877F2] hover:bg-[#166FE5] text-white ${clientConfig.cardStyle} h-12 font-medium transition-all hover:shadow-lg`}
                  >
                    <SocialIcon provider="facebook" />
                    <span className="ml-3">Continuar com Facebook</span>
                  </Button>
                )}

                {clientConfig.loginMethods.google && (
                  <Button
                    onClick={() => handleSocialLogin("google")}
                    disabled={isConnecting}
                    variant="outline"
                    className={`w-full bg-white hover:bg-gray-50 text-gray-700 border-2 ${clientConfig.cardStyle} h-12 font-medium transition-all hover:shadow-lg`}
                  >
                    <SocialIcon provider="google" />
                    <span className="ml-3">Continuar com Google</span>
                  </Button>
                )}

                {clientConfig.loginMethods.instagram && (
                  <Button
                    onClick={() => handleSocialLogin("instagram")}
                    disabled={isConnecting}
                    className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white ${clientConfig.cardStyle} h-12 font-medium transition-all hover:shadow-lg`}
                  >
                    <SocialIcon provider="instagram" />
                    <span className="ml-3">Continuar com Instagram</span>
                  </Button>
                )}

                {clientConfig.loginMethods.whatsapp && (
                  <Button
                    onClick={() => handleSocialLogin("whatsapp")}
                    disabled={isConnecting}
                    className={`w-full bg-[#25D366] hover:bg-[#22C55E] text-white ${clientConfig.cardStyle} h-12 font-medium transition-all hover:shadow-lg`}
                  >
                    <SocialIcon provider="whatsapp" />
                    <span className="ml-3">Continuar com WhatsApp</span>
                  </Button>
                )}

                {clientConfig.loginMethods.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${clientConfig.cardStyle} border-2`}
                      style={{ borderColor: clientConfig.brandColor + "40" }}
                    />
                  </div>
                )}

                {clientConfig.loginMethods.phone && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`${clientConfig.cardStyle} border-2`}
                      style={{ borderColor: clientConfig.brandColor + "40" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Termos e Condições */}
            {clientConfig.termsRequired && (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-relaxed"
                    style={{ color: clientConfig.secondaryTextColor }}
                  >
                    Aceito os{" "}
                    <a href="#" className="font-medium underline" style={{ color: clientConfig.brandColor }}>
                      termos de uso
                    </a>{" "}
                    e{" "}
                    <a href="#" className="font-medium underline" style={{ color: clientConfig.brandColor }}>
                      política de privacidade
                    </a>
                    .
                  </Label>
                </div>
              </div>
            )}

            {/* Botão de Conexão */}
            <Button
              className={`w-full h-12 ${clientConfig.cardStyle} font-medium text-lg transition-all hover:shadow-lg disabled:opacity-50`}
              disabled={
                (!acceptedTerms && clientConfig.termsRequired) ||
                (clientConfig.loginMethods.voucher && !voucherCode && !username && !email && !phone) ||
                (clientConfig.loginMethods.userPassword && (!username || !password)) ||
                isConnecting ||
                !hasAnyLoginMethod
              }
              onClick={handleConnect}
              style={{ backgroundColor: clientConfig.brandColor }}
            >
              <Wifi className="h-5 w-5 mr-3" />
              {isConnecting ? "Conectando..." : "Conectar ao Wi-Fi"}
            </Button>

            {/* Informações da Rede */}
            <div className="text-center text-xs space-y-1" style={{ color: clientConfig.secondaryTextColor }}>
              <p className="font-medium">Rede: {clientConfig.ssid}</p>
              <p className="opacity-75">Cliente: {clientKey}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
