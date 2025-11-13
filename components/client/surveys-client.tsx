"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Eye, Trash2 } from "lucide-react"
import { createEnquete, updateEnqueteStatus, deleteEnquete } from "@/app/actions/enquetes"

type QuestionType = "texto" | "escala" | "multipla_escolha" | "sim_nao"

interface SurveyQuestion {
  tipo: QuestionType
  pergunta: string
  opcoes?: string[]
  obrigatoria: boolean
}

interface Survey {
  id: string
  titulo: string
  descricao?: string | null
  status: "ativa" | "pausada" | "encerrada" | string
  total_respostas?: number | null
  questoes?: SurveyQuestion[]
  criado_em?: string
  created_at?: string
}

export function SurveysClient({ initialSurveys }: { initialSurveys: Survey[] }) {
  const [surveys, setSurveys] = useState<Survey[]>(() =>
    initialSurveys.map((survey) => ({
      ...survey,
      questoes: (survey.questoes || []).map((questao) => {
        const rawOptions = questao.opcoes as unknown
        const opcoes = Array.isArray(rawOptions)
          ? (rawOptions as string[])
          : typeof rawOptions === "string"
            ? [rawOptions]
            : []

        return {
          ...questao,
          opcoes,
        }
      }),
    })),
  )
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSurvey, setNewSurvey] = useState({
    titulo: "",
    descricao: "",
    questoes: [] as SurveyQuestion[],
  })
  const [newQuestion, setNewQuestion] = useState<SurveyQuestion>({
    tipo: "texto",
    pergunta: "",
    obrigatoria: false,
    opcoes: [],
  })

  const addQuestion = () => {
    if (!newQuestion.pergunta) return

    const question: SurveyQuestion = {
      tipo: newQuestion.tipo,
      pergunta: newQuestion.pergunta,
      opcoes: newQuestion.opcoes?.length ? newQuestion.opcoes : undefined,
      obrigatoria: newQuestion.obrigatoria,
    }

    setNewSurvey({
      ...newSurvey,
      questoes: [...newSurvey.questoes, question],
    })

    setNewQuestion({
      tipo: "texto",
      pergunta: "",
      obrigatoria: false,
      opcoes: [],
    })
  }

  const handleCreate = async () => {
    if (!newSurvey.titulo || newSurvey.questoes.length === 0) {
      alert("Preencha o título e adicione pelo menos uma pergunta")
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createEnquete(newSurvey)
      setSurveys((prev) => [
        {
          ...created,
          questoes: newSurvey.questoes,
          titulo: created?.titulo ?? newSurvey.titulo,
          descricao: created?.descricao ?? newSurvey.descricao,
          total_respostas: created?.total_respostas ?? 0,
        } as Survey,
        ...prev,
      ])
      setIsCreating(false)
      setNewSurvey({ titulo: "", descricao: "", questoes: [] })
    } catch (error) {
      console.error("[v0] Error creating survey:", error)
      alert("Erro ao criar enquete")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ativa" ? "pausada" : "ativa"
    try {
      await updateEnqueteStatus(id, newStatus)
      setSurveys(surveys.map((s) => (s.id === id ? { ...s, status: newStatus as Survey["status"] } : s)))
    } catch (error) {
      console.error("[v0] Error updating survey:", error)
      alert("Erro ao atualizar enquete")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta enquete?")) return

    try {
      await deleteEnquete(id)
      setSurveys(surveys.filter((s) => s.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting survey:", error)
      alert("Erro ao excluir enquete")
    }
  }

  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case "escala":
        return "⭐"
      case "multipla_escolha":
        return "☑️"
      case "sim_nao":
        return "✅"
      default:
        return "📝"
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Enquete
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Enquete</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título da Enquete</Label>
                  <Input
                    value={newSurvey.titulo}
                    onChange={(e) => setNewSurvey({ ...newSurvey, titulo: e.target.value })}
                    placeholder="Ex: Pesquisa de Satisfação"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newSurvey.descricao}
                    onChange={(e) => setNewSurvey({ ...newSurvey, descricao: e.target.value })}
                    placeholder="Breve descrição da enquete"
                    rows={2}
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Adicionar Pergunta</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Pergunta</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newQuestion.tipo}
                      onChange={(e) => setNewQuestion({ ...newQuestion, tipo: e.target.value as QuestionType })}
                    >
                      <option value="texto">📝 Texto</option>
                      <option value="escala">⭐ Avaliação (1-5)</option>
                      <option value="multipla_escolha">☑️ Múltipla Escolha</option>
                      <option value="sim_nao">✅ Sim/Não</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newQuestion.obrigatoria}
                      onChange={(e) => setNewQuestion({ ...newQuestion, obrigatoria: e.target.checked })}
                    />
                    <Label>Obrigatória</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input
                    value={newQuestion.pergunta || ""}
                    onChange={(e) => setNewQuestion({ ...newQuestion, pergunta: e.target.value })}
                    placeholder="Digite sua pergunta"
                  />
                </div>

                {newQuestion.tipo === "multipla_escolha" && (
                  <div className="space-y-2">
                    <Label>Opções (uma por linha)</Label>
                    <Textarea
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          opcoes: e.target.value.split("\n").filter((o) => o.trim()),
                        })
                      }
                      rows={3}
                    />
                  </div>
                )}

                <Button onClick={addQuestion} disabled={!newQuestion.question}>
                  Adicionar Pergunta
                </Button>
              </div>

              {newSurvey.questoes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Perguntas ({newSurvey.questoes.length})</h3>
                  {newSurvey.questoes.map((question, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span>{getQuestionTypeIcon(question.tipo)}</span>
                            <span className="font-medium">Pergunta {index + 1}</span>
                            {question.obrigatoria && (
                              <Badge variant="outline" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700">{question.pergunta}</p>
                          {question.opcoes && question.opcoes.length > 0 && (
                            <div className="mt-2 text-sm text-gray-600">Opções: {question.opcoes.join(", ")}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setNewSurvey({
                              ...newSurvey,
                              questoes: newSurvey.questoes.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !newSurvey.titulo || newSurvey.questoes.length === 0}
              >
                {isSubmitting ? "Criando..." : "Criar Enquete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {surveys.map((survey) => (
          <Card key={survey.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{survey.titulo}</h3>
                    <Badge
                      variant={
                        survey.status === "ativa"
                          ? "default"
                          : survey.status === "pausada"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {survey.status === "ativa"
                        ? "Ativa"
                        : survey.status === "pausada"
                          ? "Pausada"
                          : survey.status === "encerrada"
                            ? "Encerrada"
                            : "Status desconhecido"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{survey.descricao}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{Array.isArray(survey.questoes) ? survey.questoes.length : 0} perguntas</span>
                    <span>•</span>
                    <span>
                      Criada em {new Date(survey.criado_em || survey.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 text-center mr-6">
                  <div>
                    <p className="text-sm text-gray-600">Respostas</p>
                    <p className="text-xl font-bold">{survey.total_respostas || 0}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(survey.id, survey.status)}>
                    {survey.status === "ativa" ? "Pausar" : "Ativar"}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(survey.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {surveys.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">Nenhuma enquete criada ainda</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Enquete
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
