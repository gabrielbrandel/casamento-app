"use client"

import { useState } from "react"
import type { Gift } from "@/data/gifts"
import { Check, X, Filter, Gift as GiftIcon } from "lucide-react"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useToast } from "@/hooks/use-toast"

export function AdminGiftList() {
  const [tab, setTab] = useState<"ativos" | "desativados" | "obtidos">("ativos")
  const { gifts, setGiftVisibility, setGiftObtained } = useAdminStore()
  const { setGiftVisibility: setPublicVisibility, setGiftObtained: setPublicObtained } = useGiftsStore()
  const { toast } = useToast()

  const active = gifts.filter((g) => g.ativo !== false && g.status !== "obtido")
  const deactivated = gifts.filter((g) => g.ativo === false)
  const obtained = gifts.filter((g) => g.status === "obtido")

  const purchased = gifts.filter((g) => g.status === "comprado")
  const list = tab === "ativos" ? active : tab === "desativados" ? deactivated : tab === "comprados" ? purchased : obtained

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Gerenciar Presentes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("ativos")}
            className={`px-3 py-2 text-sm ${tab === "ativos" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
          >
            Ativos
          </button>
          <button
            onClick={() => setTab("desativados")}
            className={`px-3 py-2 text-sm ${tab === "desativados" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
          >
            Desativados
          </button>
          <button
            onClick={() => setTab("obtidos")}
            className={`px-3 py-2 text-sm ${tab === "obtidos" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
          >
            Obtidos
          </button>
          <button
            onClick={() => setTab("comprados")}
            className={`px-3 py-2 text-sm ${tab === "comprados" ? "bg-foreground text-background" : "bg-background text-foreground"}`}
          >
            Comprados
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum presente nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((gift) => (
            <div key={gift.id} className="flex items-center gap-4 p-4 bg-background rounded border border-border">
              <img src={gift.imageUrl || "/placeholder.svg"} alt={gift.nome} className="w-16 h-16 object-cover rounded-md" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{gift.nome}</p>
                    <p className="text-sm text-muted-foreground">{gift.categoria} — {gift.precoEstimado}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const newState = gift.ativo === false ? true : false
                        setGiftVisibility(gift.id, newState)
                        setPublicVisibility(gift.id, newState)
                        toast({
                          title: newState ? 'Item ativado' : 'Item desativado',
                          description: `${gift.nome} ${newState ? 'ativado' : 'desativado'} com sucesso.`,
                        })
                      }}
                      className={`px-2 py-1 text-sm rounded ${gift.ativo === false ? 'ring-2 ring-destructive/40 text-destructive' : 'bg-muted'}`}
                    >
                      {gift.ativo === false ? 'Ativar' : 'Desativar'}
                    </button>
                    <button
                      onClick={() => {
                        const willBeObtained = gift.status !== 'obtido'
                        setGiftObtained(gift.id, willBeObtained)
                        setPublicObtained(gift.id, willBeObtained)
                        toast({
                          title: willBeObtained ? 'Item marcado como obtido' : 'Item desmarcado',
                          description: willBeObtained ? `${gift.nome} marcado como obtido.` : `${gift.nome} removido de obtidos.`,
                        })
                      }}
                      className={`px-2 py-1 text-sm rounded ${gift.status === 'obtido' ? 'bg-green-100 text-green-700' : 'bg-muted'}`}
                    >
                      {gift.status === 'obtido' ? 'Obtido' : 'Marcar obtido'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
