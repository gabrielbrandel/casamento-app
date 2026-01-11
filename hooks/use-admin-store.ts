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
    const handleExternalUpdate = () => {
      const s = localStorage.getItem(STORAGE_KEY)
      if (s) {
        try {
          setGifts(JSON.parse(s))
        } catch {}
      }
    }

    window.addEventListener("wedding-gifts-updated", handleExternalUpdate)
    window.addEventListener("storage", handleExternalUpdate)
    return () => {
      window.removeEventListener("wedding-gifts-updated", handleExternalUpdate)
      window.removeEventListener("storage", handleExternalUpdate)
    }
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
      try {
        window.dispatchEvent(new Event("wedding-gifts-updated"))
      } catch {}
      return updated
    })
  }, [])

  const updateGiftImage = useCallback((giftId: string, imageUrl: string) => {
    setGifts((prev) => {
      const updated = prev.map((gift) => (gift.id === giftId ? { ...gift, imageUrl } : gift))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      try {
        window.dispatchEvent(new Event("wedding-gifts-updated"))
      } catch {}
      return updated
    })
  }, [])

  const setGiftVisibility = useCallback((giftId: string, ativo: boolean) => {
    setGifts((prev) => {
      const updated = prev.map((gift) => (gift.id === giftId ? { ...gift, ativo } : gift))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      try {
        window.dispatchEvent(new Event("wedding-gifts-updated"))
      } catch {}
      return updated
    })
  }, [])

  const setGiftObtained = useCallback((giftId: string, obtained: boolean) => {
    setGifts((prev) => {
      const updated = prev.map((gift) =>
        gift.id === giftId ? { ...gift, status: obtained ? ("obtido" as const) : "disponivel" } : gift,
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      try {
        window.dispatchEvent(new Event("wedding-gifts-updated"))
      } catch {}
      return updated
    })
  }, [])

  const addGift = useCallback((gift: Gift) => {
    setGifts((prev) => {
      const updated = [gift, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      try {
        window.dispatchEvent(new Event("wedding-gifts-updated"))
      } catch {}
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
    // exclude deactivated and obtained items from catalog totals
    const activeCatalog = gifts.filter((g) => g.ativo !== false && g.status !== "obtido")
    const totalCatalogValue = activeCatalog.reduce((acc, g) => acc + parsePrice(g.precoEstimado), 0)

    const recebidosConfirmados = purchased.filter(
      (g) => (g.compradoPor as { recebidoConfirmado?: boolean })?.recebidoConfirmado,
    ).length

    return {
      totalPresentes: purchased.length,
      totalCatalog: activeCatalog.length,
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
    updateGiftImage,
    setGiftObtained,
    setGiftVisibility,
    addGift,
    getPurchasedGifts,
    getMessages,
    getStats,
  }
}
