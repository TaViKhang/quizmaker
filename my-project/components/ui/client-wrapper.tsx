"use client"

import * as React from "react"

interface ClientWrapperProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientWrapper({ children, fallback }: ClientWrapperProps) {
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return fallback || null
  }

  return children
} 