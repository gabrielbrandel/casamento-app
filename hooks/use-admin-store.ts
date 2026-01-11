"use client"

import { useState, useEffect, useCallback } from "react"
import { type Gift, initialGifts } from "@/data/gifts"

const STORAGE_KEY = "wedding-gifts-thais-gabriel"

export function useAdminStore() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setGifts(JSON.parse(stored))
      } catch {
        setGifts(initialGifts)
      }
    } else {
      setGifts(initialGifts)
    }
    setIsLoading(false)
  }, [])

  const markAsReceived = useCallback((giftId: string, received: boolean) => {
    setGifts((prev) => {
      const updated = prev.map((gift) =>
        gift.id === giftId && gift.compradoPor
          ? {
              ...gift,
              compradoPor: {
                ...gift.compradoPor,
                recebidoConfirmado: received,
              },
            }
          : gift,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const getPurchasedGifts = useCallback(
    (filter: "todos" | "fisico" | "pix") => {
      const purchased = gifts.filter((gift) => gift.status === "comprado" && gift.compradoPor)
      if (filter === "todos") return purchased
      return purchased.filter((gift) => gift.compradoPor?.tipoPagamento === filter)
    },
    [gifts],
  )

  const getMessages = useCallback(() => {
    return gifts
      .filter((gift) => gift.status === "comprado" && gift.compradoPor)
      .map((gift) => ({
        id: gift.id,
        nome: gift.compradoPor!.nome,
        familia: gift.compradoPor!.familia,
        telefone: gift.compradoPor?.telefone,
        mensagem: gift.compradoPor?.mensagem || "",
        presente: gift.nome,
        tipoPagamento: gift.compradoPor!.tipoPagamento,
        dataConfirmacao: gift.compradoPor!.dataConfirmacao,
        precoEstimado: gift.precoEstimado,
      }))
  }, [gifts])

  const getStats = useCallback(() => {
    const purchased = gifts.filter((gift) => gift.status === "comprado" && gift.compradoPor)
    const pixGifts = purchased.filter((g) => g.compradoPor?.tipoPagamento === "pix")
    const fisicoGifts = purchased.filter((g) => g.compradoPor?.tipoPagamento === "fisico")

    const parsePrice = (price: string) => {
      const num = price.replace(/[^\d,]/g, "").replace(",", ".")
      return Number.parseFloat(num) || 0
    }

    const totalPix = pixGifts.reduce((acc, g) => acc + parsePrice(g.precoEstimado), 0)
    const totalFisico = fisicoGifts.reduce((acc, g) => acc + parsePrice(g.precoEstimado), 0)
    const totalCatalogValue = gifts.reduce((acc, g) => acc + parsePrice(g.precoEstimado), 0)

    const recebidosConfirmados = purchased.filter(
      (g) => (g.compradoPor as { recebidoConfirmado?: boolean })?.recebidoConfirmado,
    ).length

    return {
      totalPresentes: purchased.length,
      totalCatalog: gifts.length,
      totalPix: pixGifts.length,
      totalFisico: fisicoGifts.length,
      valorTotalPix: totalPix,
      valorTotalFisico: totalFisico,
      valorTotal: totalPix + totalFisico,
      valorTotalCatalogo: totalCatalogValue,
      recebidosConfirmados,
      pendentesConferencia: purchased.length - recebidosConfirmados,
    }
  }, [gifts])

  return {
    gifts,
    isLoading,
    markAsReceived,
    getPurchasedGifts,
    getMessages,
    getStats,
  }
}
