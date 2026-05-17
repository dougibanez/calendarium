"use client"

import { SessionProvider } from "next-auth/react"
import { useEffect } from "react"

function ZoomLock() {
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()
    }
    document.addEventListener("touchmove", prevent, { passive: false })
    return () => document.removeEventListener("touchmove", prevent)
  }, [])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ZoomLock />
      {children}
    </SessionProvider>
  )
}
