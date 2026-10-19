"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertMessage } from "@/components/AlertMessage"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  errorMessage?: string | null
  errorType?: "error" | "success" | "info"
  onErrorClose?: () => void
  scrollable?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  errorMessage,
  errorType = "error",
  onErrorClose,
  scrollable = true,
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className={className} style={{ padding: 0, display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        
        {/* Fixed Header */}
        <div style={{ padding: "1.5rem 1.75rem 0", flexShrink: 0 }}>
          {errorMessage && onErrorClose && (
            <div style={{ marginBottom: "0.75rem" }}>
              <AlertMessage
                message={errorMessage}
                type={errorType}
                onClose={onErrorClose}
              />
            </div>
          )}
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            overflowY: scrollable ? "auto" : "visible",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div style={{ flexShrink: 0 }}>
            <DialogFooter>
              {footer}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
