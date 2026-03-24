import React, { useState } from 'react'
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

interface ProposalModalProps {
  isOpen: boolean
  title: string
  proposalId: string
  action: 'accepted' | 'rejected'
  onConfirm: (message: string) => void
  onClose: () => void
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  title,
  action,
  onConfirm,
  onClose,
}) => {
  const [message, setMessage] = useState('')

  const isAccept = action === 'accepted'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={isAccept ? 'text-green-600' : 'text-red-600'}>
            {title}
          </DialogTitle>
          <DialogDescription>
            {isAccept
              ? 'Você está prestes a aceitar esta proposta. Deseja enviar uma mensagem para o inquilino ou imobiliária?'
              : 'Você está recusando esta proposta. Por favor, deixe um feedback sobre o motivo (opcional).'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Sua mensagem (opcional)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className={
              isAccept
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
            onClick={() => onConfirm(message)}
          >
            Confirmar {isAccept ? 'Aceite' : 'Recusa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
