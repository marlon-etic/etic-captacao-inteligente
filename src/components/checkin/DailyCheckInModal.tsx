import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { CheckInAlert } from './CheckInAlert'
import { YesterdaySummary } from './YesterdaySummary'
import { TodaySummaryCards } from './TodaySummaryCards'
import { LogVisitSection } from './LogVisitSection'
import { LogClosingSection } from './LogClosingSection'
import { NewClientCheckInForm } from './NewClientCheckInForm'
import { checkinService, CheckinDemanda } from '@/services/checkinService'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { sendWebhookEvent } from '@/services/n8nService'

export function DailyCheckInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [hasDemand, setHasDemand] = useState(true)
  const [recentDemands, setRecentDemands] = useState<CheckinDemanda[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [todayStats, setTodayStats] = useState<any>(null)
  const [yesterdayStats, setYesterdayStats] = useState<any>(null)
  const [yesterdayClients, setYesterdayClients] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && user) {
      loadData()
    }
  }, [isOpen, user])

  const loadData = async () => {
    if (!user) return
    try {
      const [demandStatus, demands, props, today, yesterday, yClients] = await Promise.all([
        checkinService.hasDemandLast24h(user.id),
        checkinService.getRecentDemands(user.id),
        checkinService.getProperties(),
        checkinService.getTodayStats(user.id),
        checkinService.getYesterdayStats(user.id),
        checkinService.getYesterdayClients(user.id),
      ])
      setHasDemand(demandStatus)
      setRecentDemands(demands)
      setProperties(props)
      setTodayStats(today)
      setYesterdayStats(yesterday)
      setYesterdayClients(yClients)
    } catch (err) {
      console.error('Error loading checkin data:', err)
    }
  }

  const handleGenerateSummary = async () => {
    if (!user) return
    try {
      await sendWebhookEvent({
        event_type: 'daily_summary',
        entity_id: user.id,
        landlord_id: 'system',
        action: 'generate',
        data: { todayStats },
        timestamp: new Date().toISOString(),
      })
      toast({ title: 'Resumo Diário gerado e enviado com sucesso!' })
      onClose()
    } catch (err) {
      toast({ title: 'Erro ao gerar resumo', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[600px] h-[90vh] md:h-[85vh] p-0 flex flex-col overflow-hidden bg-gray-50">
        <DialogHeader className="p-4 md:p-6 bg-white border-b shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900">
            Seu Check-in Diário 🚀
          </DialogTitle>
          <DialogDescription>Acompanhe e registre suas interações do dia.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6 pb-6">
            {!hasDemand && <CheckInAlert />}

            {yesterdayStats && (
              <YesterdaySummary stats={yesterdayStats} clients={yesterdayClients} />
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <Button
                onClick={() => setShowNewClientForm(true)}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold h-12 text-lg"
              >
                ➕ Registrar Novo Cliente
              </Button>
            </div>

            <LogVisitSection
              demands={recentDemands}
              properties={properties}
              onVisitLogged={loadData}
            />
            <LogClosingSection
              demands={recentDemands}
              properties={properties}
              onClosingLogged={loadData}
            />

            {todayStats && <TodaySummaryCards stats={todayStats} />}
          </div>
        </ScrollArea>

        <div className="p-4 bg-white border-t shrink-0 flex gap-3 flex-wrap sm:flex-nowrap">
          <Button variant="outline" className="flex-1 min-w-[100px]" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="secondary"
            className="flex-1 min-w-[140px] bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={() => {
              toast({ title: 'Check-in salvo temporariamente' })
              onClose()
            }}
          >
            Salvar Check-in
          </Button>
          <Button
            className="flex-1 min-w-[150px] bg-[#0070f3] hover:bg-[#005bb5] text-white"
            onClick={handleGenerateSummary}
          >
            Gerar Resumo do Dia
          </Button>
        </div>
      </DialogContent>

      <NewClientCheckInForm
        isOpen={showNewClientForm}
        onClose={() => setShowNewClientForm(false)}
        onSuccess={() => {
          setShowNewClientForm(false)
          loadData()
        }}
      />
    </Dialog>
  )
}
