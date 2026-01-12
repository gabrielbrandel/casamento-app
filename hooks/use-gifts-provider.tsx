"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react"
import { type Gift } from "@/data/gifts"

interface GiftsContextType {
  gifts: Gift[]
  isLoading: boolean
  upsertGift: (gift: Partial<Gift> & { id: string }) => void
  refreshGifts: () => Promise<void>
}

const GiftsContext = createContext<GiftsContextType | undefined>(undefined)

export function GiftsProvider({ children }: { children: ReactNode }) {
  const [gifts, setGifts] = useState<Gift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadGifts = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos timeout
      
      const res = await fetch("/api/gifts", { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (res.ok) {
        const data = await res.json()
        setGifts(data)
      } else {
        console.error('Failed to load gifts from API:', res.status, res.statusText)
        setGifts([])
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timeout loading gifts')
        } else {
          console.error('Error loading gifts:', error.message)
        }
      } else {
        console.error('Error loading gifts:', error)
      }
      setGifts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load gifts from API on mount
  useEffect(() => {
    loadGifts()
  }, [loadGifts])

  // Refresh data every 30 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadGifts()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [loadGifts])

  // Refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadGifts()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadGifts])

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
      
      // Call API to persist changes
      fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGift),
      })
        .then(() => {
          // Reload from API after successful save to ensure sync
          loadGifts()
        })
        .catch(() => console.error("Failed to upsert gift"))
      
      return updated
    })
  }

  return (
    <GiftsContext.Provider value={{ gifts, isLoading, upsertGift, refreshGifts: loadGifts }}>
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
