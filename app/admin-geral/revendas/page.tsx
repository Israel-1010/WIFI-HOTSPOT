import { getRevendas } from "@/app/actions/revendas-crud"
import { RevendasClient } from "@/components/admin-geral/revendas-client"

export default async function RevendasPage() {
  const revendas = await getRevendas()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Revendas</h1>
        <p className="text-muted-foreground">Gerencie todas as revendas do sistema com CNPJ e domínio próprio</p>
      </div>

      <RevendasClient revendas={revendas} />
    </div>
  )
}
