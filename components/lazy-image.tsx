"use client"

import { useState } from 'react'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'

interface LazyImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  width?: number
  height?: number
}

export function LazyImage({ src, alt, fill, className, width, height }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div ref={ref} className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {inView && (
        <>
          {/* Blur placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className || ''}`}
            onLoadingComplete={() => setIsLoaded(true)}
            loading="lazy"
          />
        </>
      )}
    </div>
  )
}
