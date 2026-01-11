"use client"

import { useState } from "react"
import type { Gift } from "@/data/gifts"
import { Check, X, CreditCard, Package, Filter } from "lucide-react"

interface AdminGiftListProps {
  getPurchasedGifts: (filter: "todos" | "fisico" | "pix") => Gift[]
  markAsReceived: (giftId: string, received: boolean) => void
}

export function AdminGiftList({ getPurchasedGifts, markAsReceived }: AdminGiftListProps) {
  const [filter, setFilter] = useState<"todos" | "fisico" | "pix">("todos")
  const gifts = getPurchasedGifts(filter)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-serif text-2xl text-foreground">Presentes Recebidos</h2>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setFilter("todos")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === "todos" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter("pix")}
              className={`px-4 py-2 text-sm font-medium border-l border-border transition-colors ${
                filter === "pix" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Pix
            </button>
            <button
              onClick={() => setFilter("fisico")}
              className={`px-4 py-2 text-sm font-medium border-l border-border transition-colors ${
                filter === "fisico" ? "bg-foreground text-background" : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Físico
            </button>
          </div>
        </div>
      </div>

      {gifts.length === 0 ? (
        <div className="bg-background rounded-lg border border-border p-12 text-center">
          <p className="text-muted-foreground">Nenhum presente encontrado com este filtro.</p>
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Presente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Comprado por</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-foreground">Data</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-foreground">Conferido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {gifts.map((gift) => {
                  const isReceived = (gift.compradoPor as { recebidoConfirmado?: boolean })?.recebidoConfirmado
                  return (
                    <tr key={gift.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={gift.imageUrl || "/placeholder.svg"}
                            alt={gift.nome}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div>
                            <p className="font-medium text-foreground">{gift.nome}</p>
                            <p className="text-sm text-muted-foreground">{gift.categoria}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-foreground">{gift.compradoPor?.nome}</p>
                        <p className="text-sm text-muted-foreground">Família {gift.compradoPor?.familia}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            gift.compradoPor?.tipoPagamento === "pix"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {gift.compradoPor?.tipoPagamento === "pix" ? (
                            <CreditCard className="w-3 h-3" />
                          ) : (
                            <Package className="w-3 h-3" />
                          )}
                          {gift.compradoPor?.tipoPagamento === "pix" ? "Pix" : "Físico"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-foreground">{gift.precoEstimado}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {gift.compradoPor?.dataConfirmacao && formatDate(gift.compradoPor.dataConfirmacao)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => markAsReceived(gift.id, !isReceived)}
                            className={`p-2 rounded-md transition-colors ${
                              isReceived
                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            title={isReceived ? "Marcar como não conferido" : "Marcar como conferido"}
                          >
                            {isReceived ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
