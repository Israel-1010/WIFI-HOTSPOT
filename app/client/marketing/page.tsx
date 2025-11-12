import { getMarketingStats } from "@/app/actions/marketing-stats"
import { MarketingDashboardClient } from "@/components/client/marketing-dashboard-client"

export default async function MarketingPage() {
  const stats = await getMarketingStats()

  return <MarketingDashboardClient initialStats={stats} />
}
