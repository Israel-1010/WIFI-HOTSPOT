import { getConfiguracaoPortal, getProvidersOAuth } from "@/app/actions/portal-hotspot"
import { PortalHotspotClient } from "@/components/hotspot/portal-hotspot-client"
import { notFound } from "next/navigation"

export default async function PortalHotspotPage({
  params,
}: {
  params: { clienteId: string }
}) {
  const configuracao = await getConfiguracaoPortal(params.clienteId)
  const providers = await getProvidersOAuth()

  if (!configuracao) {
    notFound()
  }

  return <PortalHotspotClient configuracao={configuracao} providers={providers} clienteId={params.clienteId} />
}
