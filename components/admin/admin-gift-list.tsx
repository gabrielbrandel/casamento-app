"use client"

import { useState } from "react"
import type { Gift } from "@/data/gifts"
import { Check, Gift as GiftIcon, EyeOff, RotateCcw, Heart, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useToast } from "@/hooks/use-toast"
import { markReceivedApi } from "@/lib/api-client"

type TabType = "ativos" | "desativados" | "processando" | "recebidos" | "jatemos"

export function AdminGiftList() {
  const [tab, setTab] = useState<TabType>("ativos")
  const [isCheckingPayments, setIsCheckingPayments] = useState(false)

  const { gifts, setGiftVisibility, setGiftObtained, markAsReceived } = useAdminStore()
  const { setGiftVisibility: setPublicVisibility, setGiftObtained: setPublicObtained } = useGiftsStore()
  const { toast } = useToast()

  const ativos = gifts.filter((g) => g.ativo !== false && g.status !== "processando_pagamento" && g.status !== "comprado" && g.status !== "obtido")
  const desativados = gifts.filter((g) => g.ativo === false)
  const processando = gifts.filter((g) => g.status === "processando_pagamento")
  const recebidos = gifts.filter((g) => g.status === "comprado")
  const jaTemos = gifts.filter((g) => g.status === "obtido")

  const list =
    tab === "ativos"
      ? ativos
      : tab === "desativados"
        ? desativados
        : tab === "processando"
          ? processando
          : tab === "recebidos"
            ? recebidos
            : jaTemos

  const removerParaAtivos = (gift: Gift) => {
    setGiftVisibility(gift.id, true)
    setPublicVisibility(gift.id, true)
    setGiftObtained(gift.id, false)
    setPublicObtained(gift.id, false)

    toast({
      title: "Presente movido para Ativos",
      description: `${gift.nome} voltou para a lista de ativos.`,
    })
  }

  const excluirDoBanco = async (gift: Gift) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o presente "${gift.nome}"?\n\nEsta ação não pode ser desfeita!`)) {
      return
    }

    try {
      const response = await fetch(`/api/gifts/${gift.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir presente')
      }

      toast({
        title: "✅ Presente Excluído",
        description: `${gift.nome} foi removido permanentemente do banco de dados.`,
      })

      // Recarregar página para refletir mudanças
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erro ao Excluir",
        description: error instanceof Error ? error.message : "Tente novamente",
      })
    }
  }

  const verificarTodosPagamentos = async () => {
    setIsCheckingPayments(true)
    try {
      const response = await fetch('/api/payment/check-all-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          variant: 'destructive',
          title: 'Erro ao verificar pagamentos',
          description: data.error || 'Tente novamente',
        })
        return
      }

      if (data.updated && data.updated.length > 0) {
        const paidGifts = data.updated.filter((t: any) => t.status === 'paid')
        if (paidGifts.length > 0) {
          // Recarregar página para refletir mudanças
          setTimeout(() => window.location.reload(), 1000)
        }
      }

      toast({
        title: '✅ Verificação Concluída',
        description: `${data.paid} pagos, ${data.pending} pendentes`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao verificar',
        description: String(error),
      })
    } finally {
      setIsCheckingPayments(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground">Gerenciar Presentes</h2>

        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={verificarTodosPagamentos}
            disabled={isCheckingPayments}
            title="Verificar manualmente o status de todos os pagamentos em processamento"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isCheckingPayments ? 'animate-spin' : ''}`} /> 
            Verificar Pagamentos
          </Button>

          <Button size="sm" variant={tab === "ativos" ? "default" : "outline"} onClick={() => setTab("ativos")}>
            <GiftIcon className="w-4 h-4 mr-1" /> Ativos
          </Button>

          <Button size="sm" variant={tab === "processando" ? "secondary" : "outline"} onClick={() => setTab("processando")}>
            <GiftIcon className="w-4 h-4 mr-1" /> Processando
          </Button>

          <Button size="sm" variant={tab === "desativados" ? "destructive" : "outline"} onClick={() => setTab("desativados")}>
            <EyeOff className="w-4 h-4 mr-1" /> Desativados
          </Button>

          <Button size="sm" variant={tab === "recebidos" ? "secondary" : "outline"} onClick={() => setTab("recebidos")}>
            <GiftIcon className="w-4 h-4 mr-1" /> Recebidos
          </Button>

          <Button size="sm" variant={tab === "jatemos" ? "secondary" : "outline"} onClick={() => setTab("jatemos")}>
            <Heart className="w-4 h-4 mr-1" /> Já temos
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum presente nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((gift) => (
            <div
              key={gift.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-background rounded-lg border border-border"
            >
              <img
                src={gift.imageUrl || "/placeholder.svg"}
                alt={gift.nome}
                className="w-16 h-16 object-cover rounded-md"
              />

              <div className="flex-1">
                <p className="font-medium">{gift.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {gift.categoria} • {gift.precoEstimado}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {tab === "ativos" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setGiftVisibility(gift.id, false)
                        setPublicVisibility(gift.id, false)
                        toast({ title: "Presente desativado" })
                      }}
                    >
                      <EyeOff className="w-4 h-4 mr-2 sm:mr-1" />
                      <span className="sm:inline">Desativar</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setGiftObtained(gift.id, true)
                        setPublicObtained(gift.id, true)
                        toast({ title: "Marcado como já temos" })
                      }}
                    >
                      <Heart className="w-4 h-4 mr-2 sm:mr-1" />
                      <span className="sm:inline">Já temos</span>
                    </Button>
                  </>
                ) : tab === "processando" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => removerParaAtivos(gift)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2 sm:mr-1" />
                      Cancelar
                    </Button>
                  </>
                ) : tab === "recebidos" ? (
                  <>
                    <Button
                      size="sm"
                      variant={gift.compradoPor?.recebidoConfirmado ? "default" : "outline"}
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        const next = !gift.compradoPor?.recebidoConfirmado
                        try {
                          await markReceivedApi(gift.id, next)
                        } catch (e) {
                          // fallback to local update if API fails
                          console.error("markReceivedApi failed", e)
                        }
                        markAsReceived(gift.id, next)
                        toast({ title: next ? "Recebimento confirmado" : "Recebimento desmarcado" })
                      }}
                    >
                      <Check className="w-4 h-4 mr-2 sm:mr-1" />
                      {gift.compradoPor?.recebidoConfirmado ? "Conferido" : "Conferir"}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => removerParaAtivos(gift)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2 sm:mr-1" />
                      Remover
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => excluirDoBanco(gift)}
                    >
                      <Trash2 className="w-4 h-4 mr-2 sm:mr-1" />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => removerParaAtivos(gift)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2 sm:mr-1" />
                      Remover
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => excluirDoBanco(gift)}
                    >
                      <Trash2 className="w-4 h-4 mr-2 sm:mr-1" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
