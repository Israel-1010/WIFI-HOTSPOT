import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Wifi } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function ObrigadoPage({
  params,
  searchParams,
}: {
  params: { clienteId: string }
  searchParams: { sessao?: string }
}) {
  const supabase = await createClient()

  // Buscar configurações do portal
  const { data: config } = await supabase
    .from("configuracoes_portal")
    .select("*")
    .eq("cliente_id", params.clienteId)
    .single()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: config?.cor_primaria || "#3b82f6",
      }}
    >
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">{config?.mensagem_agradecimento || "Obrigado!"}</h1>

        <p className="text-muted-foreground mb-8">Você está conectado à internet. Aproveite sua navegação!</p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
          <Wifi className="h-4 w-4 text-green-600" />
          <span>Conexão ativa</span>
        </div>

        <form action="/hotspot">
          <Button type="submit" className="w-full">
            Voltar ao Portal
          </Button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">Esta janela pode ser fechada a qualquer momento</p>
      </Card>
    </div>
  )
}
