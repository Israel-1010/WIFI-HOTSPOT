import { getWhiteLabelConfig } from "@/app/actions/white-label"
import { WhiteLabelClient } from "@/components/admin/white-label-client"

export default async function WhiteLabelPage() {
  // Por enquanto, pega a primeira revenda
  // TODO: Pegar baseado no usuário logado
  const config = await getWhiteLabelConfig()

  return <WhiteLabelClient initialConfig={config} />
}
