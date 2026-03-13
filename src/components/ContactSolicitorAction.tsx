import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare } from 'lucide-react'
import { Demand, User } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import useAppStore from '@/stores/useAppStore'
import { InternalChatModal } from '@/components/InternalChatModal'
import { cn } from '@/lib/utils'

interface Props {
  demand: Demand
  solicitor?: User
  className?: string
  buttonClassName?: string
  buttonText?: string
}

export function ContactSolicitorAction({
  demand,
  solicitor,
  className,
  buttonClassName,
  buttonText,
}: Props) {
  const { logSolicitorContactAttempt } = useAppStore()
  const [showOptions, setShowOptions] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const handleWhatsApp = () => {
    if (!solicitor || solicitor.status === 'inativo' || !solicitor.phone) {
      setShowOptions(true)
      return
    }

    const phone = solicitor.phone.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá ${solicitor.name}, tenho dúvidas sobre a demanda de ${demand.clientName} em ${demand.location}. Você pode me ajudar?`,
    )
    const url = `https://wa.me/${phone}?text=${msg}`

    logSolicitorContactAttempt(demand.id, 'whatsapp')
    window.open(url, '_blank')
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <Button
        className={cn(
          'w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200',
          buttonClassName,
        )}
        variant="outline"
        onClick={handleWhatsApp}
      >
        {buttonText || '💬 Contatar'}
      </Button>

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-[425px] p-[16px]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Contatar Solicitante</DialogTitle>
            <DialogDescription className="text-[12px]">
              {!solicitor
                ? 'Solicitante não encontrado.'
                : solicitor.status === 'inativo'
                  ? 'Solicitante não está disponível.'
                  : 'Número não disponível. Escolha uma alternativa:'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-[12px] py-[16px]">
            {solicitor?.email && (
              <Button
                variant="outline"
                className="h-[44px] w-full text-[14px]"
                onClick={() => {
                  logSolicitorContactAttempt(demand.id, 'email')
                  window.location.href = `mailto:${solicitor.email}?subject=Dúvida Demanda ${demand.clientName}`
                  setShowOptions(false)
                }}
              >
                <Mail className="w-5 h-5 mr-2" /> Enviar Email
              </Button>
            )}
            <Button
              variant="outline"
              className="h-[44px] w-full text-[14px]"
              onClick={() => {
                setShowOptions(false)
                setShowChat(true)
              }}
            >
              <MessageSquare className="w-5 h-5 mr-2" /> Chat Interno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InternalChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onSend={(msg) => {
          logSolicitorContactAttempt(demand.id, 'interno', msg)
        }}
        userName={solicitor?.name || 'Solicitante'}
        title="Mensagem para Solicitante"
        description={`Enviar mensagem interna para ${solicitor?.name || 'o solicitante desta demanda'}.`}
      />
    </div>
  )
}
