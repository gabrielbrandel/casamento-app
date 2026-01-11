"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  isAdminLoggedIn: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "@amora2016"

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAdminLoggedIn: false,
      login: (username: string, password: string) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          set({ isAdminLoggedIn: true })
          return true
        }
        return false
      },
      logout: () => set({ isAdminLoggedIn: false }),
    }),
    {
      name: "wedding-admin-auth",
    },
  ),
)
