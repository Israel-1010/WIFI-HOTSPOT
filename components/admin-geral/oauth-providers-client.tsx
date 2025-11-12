"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { updateOAuthProvider, toggleOAuthProvider } from "@/app/actions/oauth-providers"
import { Settings, Eye, EyeOff, Save } from "lucide-react"

interface OAuthProvider {
  id: string
  provider: string
  nome_exibicao: string
  client_id: string
  client_secret: string
  redirect_uri: string
  scopes: string[]
  ativo: boolean
  icone?: string
  cor_primaria?: string
  ordem: number
}

export function OAuthProvidersClient({ providers, stats }: { providers: OAuthProvider[]; stats: any }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState<{ [key: string]: any }>({})

  const handleEdit = (provider: OAuthProvider) => {
    setEditingId(provider.id)
    setFormData({
      [provider.id]: {
        client_id: provider.client_id,
        client_secret: provider.client_secret,
        redirect_uri: provider.redirect_uri,
        scopes: provider.scopes.join(", "),
      },
    })
  }

  const handleSave = async (id: string) => {
    const data = formData[id]
    await updateOAuthProvider(id, {
      client_id: data.client_id,
      client_secret: data.client_secret,
      redirect_uri: data.redirect_uri,
      scopes: data.scopes.split(",").map((s: string) => s.trim()),
    })
    setEditingId(null)
  }

  const handleToggle = async (id: string, ativo: boolean) => {
    await toggleOAuthProvider(id, ativo)
  }

  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: string } = {
      google: "🔍",
      facebook: "📘",
      microsoft: "🪟",
      apple: "🍎",
      linkedin: "💼",
    }
    return icons[provider] || "🔐"
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => {
        const isEditing = editingId === provider.id
        const data = formData[provider.id] || {}
        const userCount = stats.usuariosPorProvider[provider.provider] || 0
        const authCount = stats.autenticacoesPorProvider[provider.provider] || 0

        return (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getProviderIcon(provider.provider)}</div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {provider.nome_exibicao}
                      {provider.ativo ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {userCount} usuários • {authCount} autenticações hoje
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={provider.ativo} onCheckedChange={(checked) => handleToggle(provider.id, checked)} />
                  {!isEditing ? (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(provider)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={() => handleSave(provider.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isEditing && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={data.client_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider.id]: { ...data, client_id: e.target.value },
                      })
                    }
                    placeholder="Digite o Client ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets[provider.id] ? "text" : "password"}
                      value={data.client_secret || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [provider.id]: { ...data, client_secret: e.target.value },
                        })
                      }
                      placeholder="Digite o Client Secret"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setShowSecrets({
                          ...showSecrets,
                          [provider.id]: !showSecrets[provider.id],
                        })
                      }
                    >
                      {showSecrets[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Redirect URI</Label>
                  <Input
                    value={data.redirect_uri || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider.id]: { ...data, redirect_uri: e.target.value },
                      })
                    }
                    placeholder="/api/auth/callback/google"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Scopes (separados por vírgula)</Label>
                  <Input
                    value={data.scopes || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [provider.id]: { ...data, scopes: e.target.value },
                      })
                    }
                    placeholder="email, profile"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
