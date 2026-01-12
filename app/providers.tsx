"use client"

import type React from "react"
import { GiftsProvider } from "@/hooks/use-gifts-provider"
import { Toaster } from "@/components/ui/toaster"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <GiftsProvider>
      {children}
      <Toaster />
    </GiftsProvider>
  )
}
