import { getConfiguracaoPortal, getProvidersOAuth } from "@/app/actions/portal-hotspot"
import { PortalPreviewClient } from "@/components/client/portal-preview-client"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function PortalPreviewPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const clienteId = session.user.role === "cliente" ? session.user.id : session.user.cliente_id

  console.log("[v0] Portal Preview - Session user:", session.user)
  console.log("[v0] Portal Preview - Cliente ID determinado:", clienteId)

  if (!clienteId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Erro: Cliente não encontrado</p>
      </div>
    )
  }

  const configuracao = await getConfiguracaoPortal(clienteId)
  const providers = await getProvidersOAuth()

  console.log("[v0] Portal Preview - Configuração carregada:", configuracao)
  console.log("[v0] Portal Preview - Providers carregados:", providers)
  console.log("[v0] Portal Preview - Quantidade de providers:", providers?.length || 0)

  return <PortalPreviewClient clienteId={clienteId} configuracaoInicial={configuracao} providersInicial={providers} />
}
