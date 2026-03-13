import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function InternalChatModal({
  isOpen,
  onClose,
  onSend,
  capturerName,
  userName,
  title,
  description,
}: {
  isOpen: boolean
  onClose: () => void
  onSend: (msg: string) => void
  capturerName?: string
  userName?: string
  title?: string
  description?: string
}) {
  const [msg, setMsg] = useState('')
  const targetName = userName || capturerName || 'Usuário'

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title || 'Mensagem Interna'}</DialogTitle>
          <DialogDescription>
            {description || (
              <>
                Enviar mensagem para <strong>{targetName}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Digite sua mensagem aqui..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSend(msg)
              setMsg('')
              onClose()
            }}
            disabled={!msg.trim()}
          >
            Enviar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
