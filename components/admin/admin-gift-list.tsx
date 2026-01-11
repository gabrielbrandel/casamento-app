"use client"

import { useState } from "react"
import type { Gift } from "@/data/gifts"
import { Check, Gift as GiftIcon, EyeOff, RotateCcw, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminStore } from "@/hooks/use-admin-store"
import { useGiftsStore } from "@/hooks/use-gifts-store"
import { useToast } from "@/hooks/use-toast"

type TabType = "ativos" | "desativados" | "recebidos" | "jatemos"

export function AdminGiftList() {
  const [tab, setTab] = useState<TabType>("ativos")

  const { gifts, setGiftVisibility, setGiftObtained, markAsReceived } = useAdminStore()
  const { setGiftVisibility: setPublicVisibility, setGiftObtained: setPublicObtained } = useGiftsStore()
  const { toast } = useToast()

  const ativos = gifts.filter((g) => g.ativo !== false && g.status !== "comprado" && g.status !== "obtido")
  const desativados = gifts.filter((g) => g.ativo === false)
  const recebidos = gifts.filter((g) => g.status === "comprado")
  const jaTemos = gifts.filter((g) => g.status === "obtido")

  const list =
    tab === "ativos"
      ? ativos
      : tab === "desativados"
        ? desativados
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground">Gerenciar Presentes</h2>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={tab === "ativos" ? "default" : "outline"} onClick={() => setTab("ativos")}>
            <GiftIcon className="w-4 h-4 mr-1" /> Ativos
          </Button>

          <Button size="sm" variant={tab === "desativados" ? "destructive" : "outline"} onClick={() => setTab("desativados")}>
            <EyeOff className="w-4 h-4 mr-1" /> Desativados
          </Button>

          <Button size="sm" variant={tab === "recebidos" ? "secondary" : "outline"} onClick={() => setTab("recebidos")}>
            <GiftIcon className="w-4 h-4 mr-1" /> Presentes recebidos
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
            <div key={gift.id} className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
              <img src={gift.imageUrl || "/placeholder.svg"} alt={gift.nome} className="w-16 h-16 object-cover rounded-md" />

              <div className="flex-1">
                <p className="font-medium">{gift.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {gift.categoria} • {gift.precoEstimado}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {tab === "ativos" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setGiftVisibility(gift.id, false)
                        setPublicVisibility(gift.id, false)
                        toast({ title: "Presente desativado" })
                      }}
                    >
                      <EyeOff className="w-4 h-4 mr-1" /> Desativar
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setGiftObtained(gift.id, true)
                        setPublicObtained(gift.id, true)
                        toast({ title: "Marcado como já temos" })
                      }}
                    >
                      <Heart className="w-4 h-4 mr-1" /> Marcar como já temos
                    </Button>
                  </>
                ) : tab === "recebidos" ? (
                  <>
                    <Button
                      size="sm"
                      variant={gift.compradoPor?.recebidoConfirmado ? "default" : "outline"}
                      onClick={() => {
                        const next = !gift.compradoPor?.recebidoConfirmado
                        markAsReceived(gift.id, next)
                        toast({ title: next ? "Recebimento confirmado" : "Recebimento desmarcado" })
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />{" "}
                      {gift.compradoPor?.recebidoConfirmado ? "Conferido" : "Conferir"}
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => removerParaAtivos(gift)}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Remover
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => removerParaAtivos(gift)}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Remover
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
