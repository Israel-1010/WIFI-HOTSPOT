import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { NocDashboard } from "@/components/admin/noc-dashboard"
import { getOperationsOverview, getAccessPointMap, getLoginFailureInsights, getHealthChecks } from "@/app/actions/noc"

export default async function OperacoesPage() {
  const session = await getSession()

  if (!session || !["admin_geral", "admin_revenda", "operador_noc"].includes(session.user.role)) {
    redirect("/auth/login")
  }

  const revendaId = session.user.role === "admin_revenda" ? session.user.revenda_id : null

  const [overview, map, login, health] = await Promise.all([
    getOperationsOverview({ revendaId }),
    getAccessPointMap({ revendaId }),
    getLoginFailureInsights({ revendaId }),
    getHealthChecks({ revendaId }),
  ])

  return <NocDashboard overview={overview} map={map} login={login} health={health} />
}
