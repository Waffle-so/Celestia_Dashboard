"use client"

import * as React from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

interface AlertMessageProps {
  message: string | null
  type?: "error" | "success" | "info"
  onClose: () => void
  duration?: number
}

export function AlertMessage({
  message,
  type = "error",
  onClose,
  duration = 4000,
}: AlertMessageProps) {
  React.useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  const bgColors = {
    error: "bg-red-500/10 border-red-500/20 text-red-500",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    info: "bg-blue-500/10 border-blue-500/20 text-blue-500",
  }

  const Icons = {
    error: AlertCircle,
    success: CheckCircle2,
    info: Info,
  }

  const Icon = Icons[type]

  return (
    <div className={`flex items-start gap-3 p-4 mb-4 border rounded-xl animate-in fade-in slide-in-from-top-2 ${bgColors[type]}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button 
        onClick={onClose}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
