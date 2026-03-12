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
}: {
  isOpen: boolean
  onClose: () => void
  onSend: (msg: string) => void
  capturerName: string
}) {
  const [msg, setMsg] = useState('')

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mensagem Interna</DialogTitle>
          <DialogDescription>
            Enviar mensagem para o captador <strong>{capturerName}</strong>
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
