import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSend: (message: string) => void
  userName: string
  title?: string
  description?: string
}

export function InternalChatModal({
  isOpen,
  onClose,
  onSend,
  userName,
  title,
  description,
}: Props) {
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return
    onSend(message.trim())
    setMessage('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title || `Mensagem para ${userName}`}</DialogTitle>
          <DialogDescription>
            {description ||
              `A mensagem será enviada pelo sistema e ${userName} receberá uma notificação.`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            className="min-h-[120px] resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="w-4 h-4 mr-2" /> Enviar Mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
