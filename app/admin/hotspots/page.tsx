import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { HotspotsClient } from "@/components/admin/hotspots-client"
import { getHotspots } from "@/app/actions/hotspots-revenda"

export default async function HotspotsPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin_revenda") {
    redirect("/auth/login")
  }

  const hotspots = await getHotspots(session.user.revenda_id!)

  return <HotspotsClient hotspots={hotspots} revendaId={session.user.revenda_id!} />
}
