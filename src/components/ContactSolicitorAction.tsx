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
import { useTimeElapsed } from '@/hooks/useTimeElapsed'
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
  const { logSolicitorContactAttempt, currentUser } = useAppStore()
  const [showOptions, setShowOptions] = useState(false)
  const [showChat, setShowChat] = useState(false)

  const timeElapsed = useTimeElapsed(demand.lastContactedSolicitorAt)

  const canContact = currentUser?.role === 'captador' || currentUser?.role === 'admin'
  if (!canContact) return null

  const handleWhatsApp = () => {
    if (!solicitor || solicitor.status === 'inativo') {
      setShowOptions(true)
      return
    }
    if (!solicitor.phone) {
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
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      <Button
        className={cn(
          'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs sm:text-sm font-semibold',
          buttonClassName,
        )}
        variant="outline"
        onClick={handleWhatsApp}
      >
        {buttonText || '💬 DÚVIDAS SOBRE ESTA DEMANDA?'}
      </Button>
      {demand.lastContactedSolicitorAt && (
        <span className="text-[10px] text-muted-foreground text-center block font-medium">
          Último contato: {timeElapsed.text}
        </span>
      )}

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contatar Solicitante</DialogTitle>
            <DialogDescription>
              {!solicitor
                ? 'Solicitante não encontrado.'
                : solicitor.status === 'inativo'
                  ? 'Solicitante não está disponível.'
                  : 'Número não disponível. Escolha uma alternativa:'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {solicitor?.email && (
              <Button
                variant="outline"
                onClick={() => {
                  logSolicitorContactAttempt(demand.id, 'email')
                  window.location.href = `mailto:${solicitor.email}?subject=Dúvida Demanda ${demand.clientName}`
                  setShowOptions(false)
                }}
              >
                <Mail className="w-4 h-4 mr-2" />📧 Enviar Email
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setShowOptions(false)
                setShowChat(true)
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />💬 Chat Interno
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
