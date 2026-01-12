"use client"

import type React from "react"
import { GiftsProvider } from "@/hooks/use-gifts-provider"
import { Toaster } from "@/components/ui/toaster"
import { TransactionPollerProvider } from "@/components/transaction-poller-provider"

export function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <GiftsProvider>
      <TransactionPollerProvider>
        {children}
        <Toaster />
      </TransactionPollerProvider>
    </GiftsProvider>
  )
}
