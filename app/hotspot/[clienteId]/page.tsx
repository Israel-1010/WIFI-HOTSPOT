import { getConfiguracaoPortal, getProvidersOAuth } from "@/app/actions/portal-hotspot"
import { PortalHotspotClient } from "@/components/hotspot/portal-hotspot-client"
import { notFound } from "next/navigation"
import { getCampanhasDoCliente } from "@/app/actions/campanhas"
import { getEnquetesDoCliente } from "@/app/actions/enquetes"

export default async function PortalHotspotPage({
  params,
}: {
  params: { clienteId: string }
}) {
  const [configuracao, providers, campanhas, enquetes] = await Promise.all([
    getConfiguracaoPortal(params.clienteId),
    getProvidersOAuth(),
    getCampanhasDoCliente(params.clienteId),
    getEnquetesDoCliente(params.clienteId),
  ])

  if (!configuracao) {
    notFound()
  }

  return (
    <PortalHotspotClient
      configuracao={configuracao}
      providers={providers}
      clienteId={params.clienteId}
      campanhas={campanhas}
      enquetes={enquetes}
    />
  )
}
