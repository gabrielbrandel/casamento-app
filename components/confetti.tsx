"use client"

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/use-window-size'

interface ConfettiEffectProps {
  active: boolean
  onComplete?: () => void
}

export function ConfettiEffect({ active, onComplete }: { active: boolean; onComplete?: () => void }) {
  if (typeof window === 'undefined') return null
  
  return active ? (
    <Confetti
      width={window.innerWidth}
      height={window.innerHeight}
      recycle={false}
      numberOfPieces={500}
      gravity={0.3}
      onConfettiComplete={() => onComplete?.()}
    />
  ) : null
}
