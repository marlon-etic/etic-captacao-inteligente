import { Button } from '@/components/ui/button'
import { Demand, User } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
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
  const { toast } = useToast()

  const handleWhatsApp = () => {
    if (!solicitor || solicitor.status === 'inativo' || !solicitor.phone) {
      toast({
        title: 'Erro',
        description: 'Número não disponível',
        variant: 'destructive',
      })
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
    </div>
  )
}
