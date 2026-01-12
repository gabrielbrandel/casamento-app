"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { type Gift, initialGifts } from "@/data/gifts"

const STORAGE_KEY = "wedding-gifts-thais-gabriel"

interface GiftsContextType {
  gifts: Gift[]
  isLoading: boolean
  upsertGift: (gift: Partial<Gift> & { id: string }) => void
}

const GiftsContext = createContext<GiftsContextType | undefined>(undefined)

export function GiftsProvider({ children }: { children: ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load gifts from API once on mount
  useEffect(() => {
    const loadGifts = async () => {
      try {
        const res = await fetch("/api/gifts")
        if (res.ok) {
          const data = await res.json()
          setGifts(data)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } else {
          const stored = localStorage.getItem(STORAGE_KEY)
          setGifts(stored ? JSON.parse(stored) : initialGifts)
        }
      } catch {
        const stored = localStorage.getItem(STORAGE_KEY)
        setGifts(stored ? JSON.parse(stored) : initialGifts)
      } finally {
        setIsLoading(false)
      }
    }

    loadGifts()
  }, [])

  const upsertGift = (updatedGift: Partial<Gift> & { id: string }) => {
    setGifts((prev) => {
      const exists = prev.find((g) => g.id === updatedGift.id)
      let updated
      if (exists) {
        // For existing gifts, merge with current values
        updated = prev.map((g) => (g.id === updatedGift.id ? { ...g, ...updatedGift } : g))
      } else {
        // For new gifts, create with defaults
        const defaultGift: Gift = {
          id: updatedGift.id,
          nome: updatedGift.nome || "",
          categoria: updatedGift.categoria || "Outros",
          precoEstimado: updatedGift.precoEstimado || "R$ 0,00",
          faixaPreco: updatedGift.faixaPreco || "baixo",
          imageUrl: updatedGift.imageUrl || "/placeholder.svg",
          status: updatedGift.status || "disponivel",
          ativo: updatedGift.ativo !== false,
        }
        if (updatedGift.compradoPor) {
          defaultGift.compradoPor = updatedGift.compradoPor
        }
        updated = [...prev, defaultGift]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      
      // Call API in background only if there are actual changes
      setTimeout(() => {
        fetch("/api/gifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedGift),
        }).catch(() => console.error("Failed to upsert gift"))
      }, 100)
      
      return updated
    })
  }

  return (
    <GiftsContext.Provider value={{ gifts, isLoading, upsertGift }}>
      {children}
    </GiftsContext.Provider>
  )
}

export function useGiftsContext() {
  const context = useContext(GiftsContext)
  if (!context) {
    throw new Error("useGiftsContext must be used within GiftsProvider")
  }
  return context
}
