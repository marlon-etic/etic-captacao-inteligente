import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ModalDemandaLocacao } from '@/components/ModalDemandaLocacao'
import { ModalDemandaVenda } from '@/components/ModalDemandaVenda'
import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  type: 'Venda' | 'Aluguel'
}

export function CreateDemandModal({ isOpen, onClose, type }: Props) {
  if (type === 'Aluguel') {
    return <ModalDemandaLocacao isOpen={isOpen} onClose={onClose} />
  }

  return <ModalDemandaVenda isOpen={isOpen} onClose={onClose} />
}
