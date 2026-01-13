"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[]
  addFavorite: (giftId: string) => void
  removeFavorite: (giftId: string) => void
  isFavorite: (giftId: string) => boolean
  toggleFavorite: (giftId: string) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (giftId: string) => 
        set((state) => ({ 
          favorites: [...state.favorites, giftId] 
        })),
      removeFavorite: (giftId: string) =>
        set((state) => ({ 
          favorites: state.favorites.filter(id => id !== giftId) 
        })),
      isFavorite: (giftId: string) => 
        get().favorites.includes(giftId),
      toggleFavorite: (giftId: string) => {
        const state = get()
        if (state.isFavorite(giftId)) {
          state.removeFavorite(giftId)
        } else {
          state.addFavorite(giftId)
        }
      },
    }),
    {
      name: 'wedding-favorites-storage',
    }
  )
)
