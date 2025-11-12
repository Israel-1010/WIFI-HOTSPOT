import { getOAuthProviders, getOAuthStats } from "@/app/actions/oauth-providers"
import { OAuthProvidersClient } from "@/components/admin-geral/oauth-providers-client"

export default async function OAuthProvidersPage() {
  const { providers } = await getOAuthProviders()
  const stats = await getOAuthStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Autenticação Social</h1>
        <p className="text-muted-foreground mt-2">
          Configure as integrações OAuth centralizadas para todas as revendas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
          <p className="text-sm text-muted-foreground">Total de Usuários</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{stats.totalAutenticacoesHoje}</div>
          <p className="text-sm text-muted-foreground">Autenticações Hoje</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{providers.filter((p) => p.ativo).length}</div>
          <p className="text-sm text-muted-foreground">Providers Ativos</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-2xl font-bold">{providers.length}</div>
          <p className="text-sm text-muted-foreground">Total de Providers</p>
        </div>
      </div>

      <OAuthProvidersClient providers={providers} stats={stats} />
    </div>
  )
}
