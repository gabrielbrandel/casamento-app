"use client"

import { useState } from "react"
import { Gift, CreditCard, Package, CheckCircle, Clock, DollarSign, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Stats {
  totalPresentes: number
  totalCatalog: number
  totalPix: number
  totalFisico: number
  valorTotalPix: number
  valorTotalFisico: number
  valorTotal: number
  valorTotalCatalogo: number
  recebidosConfirmados: number
  pendentesConferencia: number
}

interface AdminStatsProps {
  stats: Stats
}

export function AdminStats({ stats }: AdminStatsProps) {
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const { toast } = useToast()

  const handleCleanupOldTransactions = async () => {
    if (!confirm('Tem certeza que deseja limpar transações pendentes há mais de 1 hora? Os presentes voltarão para disponível.')) {
      return
    }

    setIsCleaningUp(true)
    try {
      const response = await fetch('/api/transaction/cleanup-old', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Limpeza concluída',
          description: data.message,
        })
        
        // Recarregar a página para atualizar os dados
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro na limpeza',
          description: data.error || 'Não foi possível limpar transações antigas',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao limpar',
        description: 'Erro ao conectar com o servidor',
      })
    } finally {
      setIsCleaningUp(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="space-y-8">
      {/* Botões de ação */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleCleanupOldTransactions}
          disabled={isCleaningUp}
          variant="outline"
          size="sm"
        >
          {isCleaningUp ? (
            <>
              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Limpando...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Transações Antigas
            </>
          )}
        </Button>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-foreground mb-6">Resumo Geral</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <Gift className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Total de Presentes Comprados</span>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stats.totalPresentes}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <Package className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Itens no Catálogo</span>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stats.totalCatalog}</p>
          </div>


          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-muted-foreground">Conferidos</span>
            </div>
            <p className="text-3xl font-semibold text-green-600">{stats.recebidosConfirmados}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-3xl font-semibold text-amber-600">{stats.pendentesConferencia}</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-muted rounded-md">
                <DollarSign className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(stats.valorTotal)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-xl text-foreground mb-4">Por Tipo de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-md">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <span className="font-medium text-foreground">Pix</span>
              </div>
              <span className="text-sm text-muted-foreground">{stats.totalPix} presentes</span>
            </div>
            <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.valorTotalPix)}</p>
            <p className="text-sm text-muted-foreground mt-1">Valor total em Pix</p>
          </div>

          <div className="bg-background rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-md">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-foreground">Físico</span>
              </div>
              <span className="text-sm text-muted-foreground">{stats.totalFisico} presentes</span>
            </div>
            <p className="text-2xl font-semibold text-blue-600">{formatCurrency(stats.valorTotalFisico)}</p>
            <p className="text-sm text-muted-foreground mt-1">Valor estimado em presentes físicos</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-serif text-lg text-foreground mb-2">Valor total do catálogo</h3>
          <div className="bg-background rounded-lg p-4 border border-border inline-block">
            <p className="text-2xl font-semibold">{formatCurrency(stats.valorTotalCatalogo)}</p>
            <p className="text-sm text-muted-foreground mt-1">Soma dos preços estimados de todos os itens</p>
          </div>
        </div>
      </div>
    </div>
  )
}
