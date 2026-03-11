import { Clock, MessageSquareX, UserX } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function AlertsSection() {
  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      <Alert variant="destructive" className="bg-destructive/5">
        <Clock className="h-4 w-4" />
        <AlertTitle>Demandas Atrasadas</AlertTitle>
        <AlertDescription>12 demandas sem resposta há mais de 48h.</AlertDescription>
      </Alert>
      <Alert className="border-orange-500/50 bg-orange-500/5 text-orange-600 dark:text-orange-400 [&>svg]:text-orange-600 dark:[&>svg]:text-orange-400">
        <MessageSquareX className="h-4 w-4" />
        <AlertTitle>Falha de Comunicação</AlertTitle>
        <AlertDescription>Falha na entrega de WhatsApp para 3 contatos.</AlertDescription>
      </Alert>
      <Alert className="border-amber-500/50 bg-amber-500/5 text-amber-600 dark:text-amber-400 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
        <UserX className="h-4 w-4" />
        <AlertTitle>Inatividade</AlertTitle>
        <AlertDescription>2 captadores inativos há mais de 7 dias.</AlertDescription>
      </Alert>
    </div>
  )
}
