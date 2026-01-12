"use client"

import { useCallback } from "react"
import { type Gift } from "@/data/gifts"
import { useGiftsContext } from "./use-gifts-provider"

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
  const { gifts, isLoading, upsertGift } = useGiftsContext()

  const purchaseGift = useCallback((giftId: string, purchase: Omit<GiftPurchase, "giftId">) => {
    const updatedGift = {
      id: giftId,
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
    upsertGift(updatedGift)
  }, [upsertGift])

  const removeGiftPurchase = useCallback((giftId: string) => {
    const updatedGift = {
      id: giftId,
      status: "disponivel" as const,
      compradoPor: undefined,
    }
    upsertGift(updatedGift)
  }, [upsertGift])

  const updateGiftImage = useCallback((giftId: string, imageUrl: string) => {
    upsertGift({ id: giftId, imageUrl })
  }, [upsertGift])

  const updateGiftPrice = useCallback((giftId: string, precoEstimado: string, faixaPreco?: "baixo" | "medio" | "alto") => {
    upsertGift({ id: giftId, precoEstimado, faixaPreco })
  }, [upsertGift])

  const setGiftVisibility = useCallback((giftId: string, ativo: boolean) => {
    upsertGift({ id: giftId, ativo })
  }, [upsertGift])

  const setGiftObtained = useCallback((giftId: string, obtained: boolean) => {
    upsertGift({ id: giftId, status: obtained ? "obtido" : "disponivel" })
  }, [upsertGift])

  const setGiftPaymentProcessing = useCallback((giftId: string) => {
    upsertGift({ id: giftId, status: "processando_pagamento" })
  }, [upsertGift])

  const addGift = useCallback((gift: Gift) => {
    upsertGift(gift)
  }, [upsertGift])

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
    updateGiftImage,
    updateGiftPrice,
    setGiftVisibility,
    setGiftObtained,
    setGiftPaymentProcessing,
    addGift,
    getMessages,
  }
}

