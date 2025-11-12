"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wifi, Palette, Shield, Clock } from "lucide-react"

export default function HotspotConfigPage() {
  const [config, setConfig] = useState({
    ssid: "WiFi-Gratuito",
    loginMethod: "voucher",
    welcomeMessage: "Bem-vindo ao nosso Wi-Fi gratuito!",
    termsRequired: true,
    dataCollection: true,
    sessionTimeout: "2h",
    idleTimeout: "30m",
    maxUsers: 50,
    brandColor: "#2563eb",
    logo: null,
    backgroundImage: null,
  })

  const handleSaveConfig = async () => {
    // Implementar salvamento via API Mikrotik
    console.log("Salvando configuração:", config)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurar Hotspot</h1>
          <p className="text-gray-600">Personalize seu portal de login Wi-Fi</p>
        </div>
        <Button onClick={handleSaveConfig}>Salvar Configurações</Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            <Wifi className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Clock className="h-4 w-4 mr-2" />
            Limites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ssid">Nome da Rede (SSID)</Label>
                  <Input
                    id="ssid"
                    value={config.ssid}
                    onChange={(e) => setConfig({ ...config, ssid: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginMethod">Método de Login</Label>
                  <Select
                    value={config.loginMethod}
                    onValueChange={(value) => setConfig({ ...config, loginMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voucher">Voucher</SelectItem>
                      <SelectItem value="social">Redes Sociais</SelectItem>
                      <SelectItem value="email">Email/Telefone</SelectItem>
                      <SelectItem value="free">Acesso Livre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="termsRequired">Aceite de Termos Obrigatório</Label>
                    <p className="text-sm text-gray-600">Usuários devem aceitar termos de uso</p>
                  </div>
                  <Switch
                    id="termsRequired"
                    checked={config.termsRequired}
                    onCheckedChange={(checked) => setConfig({ ...config, termsRequired: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dataCollection">Coleta de Dados</Label>
                    <p className="text-sm text-gray-600">Permitir coleta de dados para marketing</p>
                  </div>
                  <Switch
                    id="dataCollection"
                    checked={config.dataCollection}
                    onCheckedChange={(checked) => setConfig({ ...config, dataCollection: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Personalização Visual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brandColor">Cor da Marca</Label>
                <div className="flex space-x-2">
                  <Input
                    id="brandColor"
                    value={config.brandColor}
                    onChange={(e) => setConfig({ ...config, brandColor: e.target.value })}
                  />
                  <div className="w-10 h-10 rounded border" style={{ backgroundColor: config.brandColor }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo da Empresa</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Clique para fazer upload do logo</p>
                  <p className="text-xs text-gray-400">PNG, JPG até 2MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Imagem de Fundo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-gray-500">Clique para fazer upload da imagem de fundo</p>
                  <p className="text-xs text-gray-400">PNG, JPG até 5MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Timeout de Sessão</Label>
                  <Select
                    value={config.sessionTimeout}
                    onValueChange={(value) => setConfig({ ...config, sessionTimeout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30m">30 minutos</SelectItem>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="2h">2 horas</SelectItem>
                      <SelectItem value="4h">4 horas</SelectItem>
                      <SelectItem value="8h">8 horas</SelectItem>
                      <SelectItem value="24h">24 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idleTimeout">Timeout de Inatividade</Label>
                  <Select
                    value={config.idleTimeout}
                    onValueChange={(value) => setConfig({ ...config, idleTimeout: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15 minutos</SelectItem>
                      <SelectItem value="30m">30 minutos</SelectItem>
                      <SelectItem value="1h">1 hora</SelectItem>
                      <SelectItem value="2h">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Limites e Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Máximo de Usuários Simultâneos</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={config.maxUsers}
                  onChange={(e) => setConfig({ ...config, maxUsers: Number.parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Perfis de Usuário</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Visitante</p>
                      <p className="text-sm text-gray-600">1 Mbps • 100MB • 1 hora</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">Premium</p>
                      <p className="text-sm text-gray-600">10 Mbps • 1GB • 4 horas</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
