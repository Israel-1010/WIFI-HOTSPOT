import { VouchersClient } from "@/components/client/vouchers-client"
import { getVouchers } from "@/app/actions/vouchers"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function VouchersPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  const vouchers = await getVouchers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
        <p className="text-gray-600">Gerencie códigos de acesso Wi-Fi</p>
      </div>

      <VouchersClient initialVouchers={vouchers} />
    </div>
  )
}
