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
    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8 mb-8">
      <div className="flex flex-col items-center gap-6">
        {/* Percentual em destaque */}
        <div className="text-center">
          <div className="text-6xl md:text-7xl font-bold text-primary mb-2">
            {stats.percentage}%
          </div>
          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <Gift className="w-5 h-5" />
            <span className="text-lg">{stats.purchased} de {stats.total} presentes escolhidos</span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full max-w-md">
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Mensagem motivacional em destaque */}
        <div className="text-center">
          <Heart className="w-10 h-10 text-red-500 fill-current animate-pulse mx-auto mb-3" />
          <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed max-w-lg">
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
