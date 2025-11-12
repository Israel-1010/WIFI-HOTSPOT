import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RelatoriosPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios & BI</h1>
      <p className="text-muted-foreground">
        Visualize métricas consolidadas, drill-down por cliente, e exporte relatórios personalizados.
      </p>
      <div className="text-center py-12 text-muted-foreground">Funcionalidade em desenvolvimento - Fase 2</div>
    </div>
  )
}
