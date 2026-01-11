"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title = "Confirmar ação",
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  open,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onCancel()
            }}
          >
            {cancelText}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onConfirm()
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
