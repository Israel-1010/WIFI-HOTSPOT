import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    console.log("[v0] API /api/session - sessão:", session ? "encontrada" : "não encontrada")

    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const userData = {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      nome_completo: session.user.nome_completo,
      role: session.user.role,
      cliente_id: session.user.cliente_id,
      revenda_id: session.user.revenda_id,
      permissoes: session.user.permissoes,
      ativo: session.user.ativo,
    }

    console.log("[v0] API /api/session - retornando dados do usuário:", {
      id: userData.id,
      username: userData.username,
      role: userData.role,
    })

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("[v0] Erro ao buscar sessão:", error)
    return NextResponse.json({ error: "Erro ao buscar sessão" }, { status: 500 })
  }
}
