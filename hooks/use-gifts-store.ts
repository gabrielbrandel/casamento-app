"use client"

import { useState, useEffect, useCallback } from "react"
import { type Gift, initialGifts } from "@/data/gifts"

const STORAGE_KEY = "wedding-gifts-thais-gabriel"

export interface GiftPurchase {
  giftId: string
  nome: string
  familia: string
  telefone: string
  mensagem?: string
  tipoPagamento: "fisico" | "pix"
  dataConfirmacao: string
}

export function useGiftsStore() {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setGifts(JSON.parse(stored))
      } catch {
        setGifts(initialGifts)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGifts))
      }
    } else {
      setGifts(initialGifts)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGifts))
    }
    setIsLoading(false)
  }, [])

  const purchaseGift = useCallback((giftId: string, purchase: Omit<GiftPurchase, "giftId">) => {
    setGifts((prev) => {
      const updated = prev.map((gift) =>
        gift.id === giftId
          ? {
              ...gift,
              status: "comprado" as const,
              compradoPor: {
                nome: purchase.nome,
                familia: purchase.familia,
                telefone: purchase.telefone,
                mensagem: purchase.mensagem,
                tipoPagamento: purchase.tipoPagamento,
                dataConfirmacao: purchase.dataConfirmacao,
              },
            }
          : gift,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeGiftPurchase = useCallback((giftId: string) => {
    setGifts((prev) => {
      const updated = prev.map((gift) =>
        gift.id === giftId
          ? {
              ...gift,
              status: "disponivel" as const,
              compradoPor: undefined,
            }
          : gift,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const getMessages = useCallback(() => {
    return gifts
      .filter((gift) => gift.compradoPor?.mensagem)
      .map((gift) => ({
        nome: gift.compradoPor!.nome,
        familia: gift.compradoPor!.familia,
        mensagem: gift.compradoPor!.mensagem!,
        presente: gift.nome,
      }))
  }, [gifts])

  return {
    gifts,
    isLoading,
    purchaseGift,
    removeGiftPurchase,
    getMessages,
  }
}
