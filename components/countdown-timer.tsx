"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock } from "lucide-react"

export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date()
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return (
    <div className="inline-flex flex-col items-center gap-4 bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span className="text-sm uppercase tracking-wider">Contagem Regressiva</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
            {timeLeft.days}
          </div>
          <div className="text-xs text-muted-foreground uppercase mt-1">Dias</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase mt-1">Horas</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase mt-1">Min</div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted-foreground uppercase mt-1">Seg</div>
        </div>
      </div>
    </div>
  )
}
