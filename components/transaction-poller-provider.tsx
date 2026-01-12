'use client'

import { useEffect } from 'react'
import { resumeActivePolling } from '@/lib/transaction-poller'

export function TransactionPollerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Retomar polling de transações pendentes ao carregar
    resumeActivePolling()
  }, [])

  return <>{children}</>
}
