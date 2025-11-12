"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Trash2, Edit, Download } from "lucide-react"
import { createVoucher, updateVoucher, deleteVoucher } from "@/app/actions/vouchers"

interface Voucher {
  id: string // Alterado de number para string (UUID)
  code: string
  title: string
  discount_type: string
  discount_value: number
  max_uses: number
  used_count: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

export function VouchersClient({ initialVouchers }: { initialVouchers: Voucher[] }) {
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers)
  const [isCreating, setIsCreating] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    discount_type: "percentage",
    discount_value: 0,
    max_uses: 1,
    expires_at: "",
  })

  const resetForm = () => {
    setFormData({
      code: "",
      title: "",
      discount_type: "percentage",
      discount_value: 0,
      max_uses: 1,
      expires_at: "",
    })
  }

  const handleCreate = async () => {
    if (!formData.code || !formData.title || formData.discount_value <= 0) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    setIsSubmitting(true)
    try {
      await createVoucher(formData)
      setIsCreating(false)
      resetForm()
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error creating voucher:", error)
      alert("Erro ao criar voucher")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingVoucher) return

    setIsSubmitting(true)
    try {
      await updateVoucher(editingVoucher.id, formData)
      setEditingVoucher(null)
      resetForm()
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error updating voucher:", error)
      alert("Erro ao atualizar voucher")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este voucher?")) return

    try {
      await deleteVoucher(id)
      setVouchers(vouchers.filter((v) => v.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting voucher:", error)
      alert("Erro ao excluir voucher")
    }
  }

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setFormData({
      code: voucher.code,
      title: voucher.title,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      max_uses: voucher.max_uses,
      expires_at: voucher.expires_at || "",
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Código copiado!")
  }

  return (
    <>
      <div className="flex justify-end mb-4 space-x-2">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>

        <Dialog
          open={isCreating || !!editingVoucher}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreating(false)
              setEditingVoucher(null)
              resetForm()
            }
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Voucher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVoucher ? "Editar Voucher" : "Criar Novo Voucher"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código do Voucher</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: PROMO2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Promoção de Verão"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder="Ex: 10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Usos</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: Number(e.target.value) })}
                    placeholder="Ex: 100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data de Expiração</Label>
                  <Input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false)
                  setEditingVoucher(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={editingVoucher ? handleUpdate : handleCreate} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : editingVoucher ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vouchers Criados ({vouchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => (
                <div key={voucher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-lg">{voucher.code}</h4>
                        <Badge variant={voucher.used_count >= voucher.max_uses ? "secondary" : "default"}>
                          {voucher.used_count >= voucher.max_uses ? "Esgotado" : "Disponível"}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {voucher.title} • Criado: {new Date(voucher.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-gray-600">Desconto</p>
                      <p className="font-medium">
                        {voucher.discount_value}
                        {voucher.discount_type === "percentage" ? "%" : "R$"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Usos</p>
                      <p className="font-medium">
                        {voucher.used_count}/{voucher.max_uses}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Válido até</p>
                      <p className="font-medium">
                        {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : "Sem limite"}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(voucher.code)}>
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleEdit(voucher)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhum voucher encontrado</p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Voucher
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
