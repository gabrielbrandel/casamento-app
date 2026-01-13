"use client"

import { Gift, Heart, TrendingUp } from "lucide-react"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useMemo } from "react"

export function PublicStats() {
  const { gifts } = useGiftsStore()

  const stats = useMemo(() => {
    const purchased = gifts.filter(g => g.status === "comprado").length
    const total = gifts.length
    const percentage = total > 0 ? Math.round((purchased / total) * 100) : 0

    const parsePrice = (p: string) => {
      if (!p) return 0
      const cleaned = p.replace(/[^\d,\.]/g, "").replace(/\./g, "").replace(/,/g, ".")
      return parseFloat(cleaned) || 0
    }

    const totalValue = gifts.reduce((sum, g) => sum + parsePrice(g.precoEstimado), 0)
    const purchasedValue = gifts
      .filter(g => g.status === "comprado")
      .reduce((sum, g) => sum + parsePrice(g.precoEstimado), 0)

    return {
      purchased,
      total,
      percentage,
      totalValue,
      purchasedValue,
    }
  }, [gifts])

  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progresso dos Presentes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-foreground">Presentes Escolhidos</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{stats.purchased} de {stats.total}</span>
              <span className="font-semibold text-primary">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Valor Arrecadado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-foreground">Valor Arrecadado</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                R$ {stats.purchasedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-muted-foreground">
                de R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${stats.totalValue > 0 ? (stats.purchasedValue / stats.totalValue * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mensagem */}
        <div className="flex flex-col justify-center items-center text-center space-y-2">
          <Heart className="w-8 h-8 text-red-500 fill-current animate-pulse" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {stats.percentage < 50 
              ? "Ajude os noivos a realizar o sonho do casamento!"
              : stats.percentage < 90
              ? "Uau! Estamos quase lá! Obrigado pelo apoio!"
              : "Vocês são incríveis! Muito obrigado! 💕"
            }
          </p>
        </div>
      </div>
    </div>
  )
}
