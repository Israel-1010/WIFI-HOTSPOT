import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAnuncios, getEstatisticasAnuncios } from "@/app/actions/anuncios"
import { AnunciosClient } from "@/components/client/anuncios-client"

export default async function AnunciosPage() {
  const session = await getSession()

  if (!session || session.user.role !== "cliente") {
    redirect("/auth/login")
  }

  const anuncios = await getAnuncios(session.user.id)
  const estatisticas = await getEstatisticasAnuncios(session.user.id)

  return <AnunciosClient anuncios={anuncios} estatisticas={estatisticas} userId={session.user.id} />
}
