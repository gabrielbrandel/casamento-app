"use client"

import { useCallback } from "react"
import { type Gift } from "@/data/gifts"
import { useGiftsContext } from "./use-gifts-provider"

export function useAdminStore() {
  const { gifts, isLoading, upsertGift } = useGiftsContext()

  const markAsReceived = useCallback((giftId: string, received: boolean) => {
    const gift = gifts.find((g) => g.id === giftId)
    if (gift && gift.compradoPor) {
      upsertGift({
        id: giftId,
        compradoPor: {
          ...gift.compradoPor,
          recebidoConfirmado: received,
        },
      })

      // Also call the specific endpoint
      fetch(`/api/gifts/receive/${giftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ received }),
      }).catch(() => {
        console.error("Failed to mark as received")
      })
    }
  }, [gifts, upsertGift])

  const updateGiftImage = useCallback((giftId: string, imageUrl: string) => {
    upsertGift({ id: giftId, imageUrl })
  }, [upsertGift])

  const updateGiftPrice = useCallback((giftId: string, precoEstimado: string, faixaPreco?: "baixo" | "medio" | "alto") => {
    upsertGift({ id: giftId, precoEstimado, faixaPreco })
  }, [upsertGift])

  const setGiftVisibility = useCallback((giftId: string, ativo: boolean) => {
    upsertGift({ id: giftId, ativo })
  }, [upsertGift])

  const setGiftHidePhysical = useCallback((giftId: string, ocultarFisico: boolean) => {
    upsertGift({ id: giftId, ocultarFisico })
  }, [upsertGift])

  const setGiftObtained = useCallback((giftId: string, obtained: boolean) => {
    upsertGift({ id: giftId, status: obtained ? "obtido" : "disponivel" })
  }, [upsertGift])

  const addGift = useCallback((gift: Gift) => {
    upsertGift(gift)
  }, [upsertGift])

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
    updateGiftPrice,
    setGiftObtained,
    setGiftVisibility,
    setGiftHidePhysical,
    addGift,
    getPurchasedGifts,
    getMessages,
    getStats,
  }
}
