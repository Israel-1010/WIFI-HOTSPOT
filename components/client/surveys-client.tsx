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

interface SurveyQuestion {
  type: "text" | "rating" | "multiple" | "yesno"
  question: string
  options?: string[]
  required: boolean
}

interface Survey {
  id: string // Alterado de number para string (UUID)
  title: string
  description: string
  status: "active" | "paused" | "draft"
  response_count: number
  questions?: SurveyQuestion[]
  created_at: string
}

export function SurveysClient({ initialSurveys }: { initialSurveys: Survey[] }) {
  const [surveys, setSurveys] = useState<Survey[]>(initialSurveys)
  const [isCreating, setIsCreating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    questions: [] as SurveyQuestion[],
  })
  const [newQuestion, setNewQuestion] = useState<Partial<SurveyQuestion>>({
    type: "text",
    question: "",
    required: false,
  })

  const addQuestion = () => {
    if (!newQuestion.question) return

    const question: SurveyQuestion = {
      type: newQuestion.type || "text",
      question: newQuestion.question,
      options: newQuestion.options,
      required: newQuestion.required || false,
    }

    setNewSurvey({
      ...newSurvey,
      questions: [...newSurvey.questions, question],
    })

    setNewQuestion({
      type: "text",
      question: "",
      required: false,
    })
  }

  const handleCreate = async () => {
    if (!newSurvey.title || newSurvey.questions.length === 0) {
      alert("Preencha o título e adicione pelo menos uma pergunta")
      return
    }

    setIsSubmitting(true)
    try {
      await createEnquete(newSurvey)
      setIsCreating(false)
      setNewSurvey({ title: "", description: "", questions: [] })
      window.location.reload()
    } catch (error) {
      console.error("[v0] Error creating survey:", error)
      alert("Erro ao criar enquete")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    try {
      await updateEnqueteStatus(id, newStatus)
      setSurveys(surveys.map((s) => (s.id === id ? { ...s, status: newStatus as any } : s)))
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

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "rating":
        return "⭐"
      case "multiple":
        return "☑️"
      case "yesno":
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
                    value={newSurvey.title}
                    onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
                    placeholder="Ex: Pesquisa de Satisfação"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={newSurvey.description}
                    onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
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
                      value={newQuestion.type}
                      onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                    >
                      <option value="text">📝 Texto</option>
                      <option value="rating">⭐ Avaliação (1-5)</option>
                      <option value="multiple">☑️ Múltipla Escolha</option>
                      <option value="yesno">✅ Sim/Não</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newQuestion.required}
                      onChange={(e) => setNewQuestion({ ...newQuestion, required: e.target.checked })}
                    />
                    <Label>Obrigatória</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pergunta</Label>
                  <Input
                    value={newQuestion.question || ""}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    placeholder="Digite sua pergunta"
                  />
                </div>

                {newQuestion.type === "multiple" && (
                  <div className="space-y-2">
                    <Label>Opções (uma por linha)</Label>
                    <Textarea
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          options: e.target.value.split("\n").filter((o) => o.trim()),
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

              {newSurvey.questions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Perguntas ({newSurvey.questions.length})</h3>
                  {newSurvey.questions.map((question, index) => (
                    <div key={index} className="border rounded p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span>{getQuestionTypeIcon(question.type)}</span>
                            <span className="font-medium">Pergunta {index + 1}</span>
                            {question.required && (
                              <Badge variant="outline" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700">{question.question}</p>
                          {question.options && (
                            <div className="mt-2 text-sm text-gray-600">Opções: {question.options.join(", ")}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setNewSurvey({
                              ...newSurvey,
                              questions: newSurvey.questions.filter((_, i) => i !== index),
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
                disabled={isSubmitting || !newSurvey.title || newSurvey.questions.length === 0}
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
                    <h3 className="text-lg font-semibold">{survey.title}</h3>
                    <Badge
                      variant={
                        survey.status === "active" ? "default" : survey.status === "paused" ? "secondary" : "outline"
                      }
                    >
                      {survey.status === "active" ? "Ativa" : survey.status === "paused" ? "Pausada" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-2">{survey.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{Array.isArray(survey.questions) ? survey.questions.length : 0} perguntas</span>
                    <span>•</span>
                    <span>Criada em {new Date(survey.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 text-center mr-6">
                  <div>
                    <p className="text-sm text-gray-600">Respostas</p>
                    <p className="text-xl font-bold">{survey.response_count}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(survey.id, survey.status)}>
                    {survey.status === "active" ? "Pausar" : "Ativar"}
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
