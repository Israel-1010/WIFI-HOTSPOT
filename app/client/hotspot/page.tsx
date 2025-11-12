import { getConfiguracaoPortal, getProvidersOAuth } from "@/app/actions/portal-hotspot"
import { getCampanhasDoCliente } from "@/app/actions/campanhas"
import { getEnquetesDoCliente } from "@/app/actions/enquetes"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PortalPreviewClient } from "@/components/client/portal-preview-client"

export default async function HotspotStudioPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const clienteId = session.user.role === "cliente" ? session.user.id : session.user.cliente_id

  if (!clienteId) {
    redirect("/client")
  }

  const [configuracao, providers, campanhas, enquetes] = await Promise.all([
    getConfiguracaoPortal(clienteId),
    getProvidersOAuth(),
    getCampanhasDoCliente(clienteId),
    getEnquetesDoCliente(clienteId),
  ])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Estúdio do Hotspot</h1>
        <p className="text-gray-600">
          Configure o portal cativo, escolha as campanhas e enquetes que serão exibidas e visualize o resultado em
          tempo real.
        </p>
      </div>

      <PortalPreviewClient
        clienteId={clienteId}
        configuracaoInicial={configuracao}
        providersInicial={providers}
        campanhasDisponiveis={campanhas}
        enquetesDisponiveis={enquetes}
      />
    </div>
  )
}
