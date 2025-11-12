import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Globe, Key, Webhook } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Personalize sua plataforma e integrações</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Marca</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Webhook className="h-4 w-4" />
            <span>Integrações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Personalização da Marca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" placeholder="Sua Empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Cor Primária</Label>
                  <div className="flex space-x-2">
                    <Input id="primary-color" value="#2563eb" />
                    <div className="w-10 h-10 bg-blue-600 rounded border"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Clique para fazer upload do logo</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                <Textarea id="welcome-message" placeholder="Bem-vindo ao nosso Wi-Fi gratuito!" rows={3} />
              </div>

              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Input id="timezone" value="America/Sao_Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma</Label>
                  <Input id="language" value="Português (Brasil)" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-logout">Logout Automático</Label>
                    <p className="text-sm text-gray-600">Desconectar usuários após inatividade</p>
                  </div>
                  <Switch id="auto-logout" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-collection">Coleta de Dados</Label>
                    <p className="text-sm text-gray-600">Permitir coleta de dados analíticos</p>
                  </div>
                  <Switch id="data-collection" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Notificações Push</Label>
                    <p className="text-sm text-gray-600">Enviar notificações para usuários</p>
                  </div>
                  <Switch id="notifications" defaultChecked />
                </div>
              </div>

              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">Chave da API</Label>
                <div className="flex space-x-2">
                  <Input id="api-key" value="hsp360_live_xxxxxxxxxxxxxxxxxxxxxxxx" readOnly />
                  <Button variant="outline">Regenerar</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL do Webhook</Label>
                <Input id="webhook-url" placeholder="https://sua-api.com/webhook" />
              </div>

              <div className="space-y-2">
                <Label>Eventos do Webhook</Label>
                <div className="space-y-2">
                  {["user.connected", "campaign.completed", "points.earned", "reward.redeemed"].map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <Switch id={event} />
                      <Label htmlFor={event}>{event}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button>Salvar API</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mikrotik RouterOS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mikrotik-ip">IP do Roteador</Label>
                    <Input id="mikrotik-ip" placeholder="192.168.1.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mikrotik-port">Porta API</Label>
                    <Input id="mikrotik-port" value="8728" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mikrotik-user">Usuário</Label>
                    <Input id="mikrotik-user" placeholder="admin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mikrotik-pass">Senha</Label>
                    <Input id="mikrotik-pass" type="password" />
                  </div>
                </div>
                <Button>Testar Conexão</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integrações CRM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="zapier-webhook">Zapier Webhook URL</Label>
                  <Input id="zapier-webhook" placeholder="https://hooks.zapier.com/..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hubspot-key">HubSpot API Key</Label>
                  <Input id="hubspot-key" placeholder="pat-na1-..." />
                </div>
                <Button>Conectar Integrações</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
