import { useState, useTransition } from 'react'
import { Filter, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DemandCard } from '@/components/DemandCard'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export default function Demandas() {
  const { demands, webhookQueue, auditLogs, triggerCron } = useAppStore()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'Venda' | 'Aluguel'>('all')
  const [isPending, startTransition] = useTransition()

  const handleTabChange = (tab: 'all' | 'Venda' | 'Aluguel') => {
    startTransition(() => {
      setActiveTab(tab)
    })
  }

  const baseDemands = demands.filter(
    (d) =>
      d.status !== 'Perdida' &&
      (d.clientName.toLowerCase().includes(search.toLowerCase()) ||
        d.location.toLowerCase().includes(search.toLowerCase())),
  )

  const countAll = baseDemands.length
  const countVenda = baseDemands.filter((d) => d.type === 'Venda').length
  const countAluguel = baseDemands.filter((d) => d.type === 'Aluguel').length

  const filtered = baseDemands.filter((d) => (activeTab === 'all' ? true : d.type === activeTab))

  const sorted = [...filtered].sort((a, b) => {
    if (activeTab === 'all') {
      if (a.type === 'Venda' && b.type !== 'Venda') return -1
      if (a.type !== 'Venda' && b.type === 'Venda') return 1
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Todas as Demandas</h1>
          <p className="text-muted-foreground text-sm">Lista completa do sistema.</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 min-h-[44px]"
              >
                <Activity className="w-4 h-4" /> Automação & Logs
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Console de Automação</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Button onClick={triggerCron} className="w-full min-h-[44px]">
                  Forçar Auditoria Cron
                </Button>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Fila de Notificações (WhatsApp)</h3>
                  <div className="space-y-2">
                    {webhookQueue.length === 0 && (
                      <p className="text-xs text-muted-foreground">Fila vazia.</p>
                    )}
                    {webhookQueue.map((q) => (
                      <div
                        key={q.id}
                        className="text-xs p-3 rounded border bg-muted/50 flex justify-between items-center"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-bold">{q.event_type}</p>
                          <p className="text-muted-foreground line-clamp-2">
                            {JSON.stringify(q.payload.data)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            q.status === 'enviado'
                              ? 'default'
                              : q.status === 'falha'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {q.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">Logs de Auditoria</h3>
                  <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-[11px] space-y-1 h-72 overflow-y-auto">
                    {auditLogs.length === 0 && (
                      <p className="text-muted-foreground">Nenhum evento registrado.</p>
                    )}
                    {auditLogs.map((l, i) => (
                      <div key={i} className="border-b border-green-900/30 pb-1">
                        {l}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Input
            placeholder="Buscar bairro ou cliente..."
            className="max-w-[200px] bg-background min-h-[44px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-4 lg:gap-6 border-b border-border/50 pb-px [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={() => handleTabChange('all')}
          className={cn(
            'h-[48px] lg:h-[44px] px-1 flex items-center justify-center gap-2 font-semibold whitespace-nowrap min-w-[44px] transition-colors',
            activeTab === 'all'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
          )}
        >
          📊 Todas ({countAll})
        </button>
        <button
          onClick={() => handleTabChange('Venda')}
          className={cn(
            'h-[48px] lg:h-[44px] px-1 flex items-center justify-center gap-2 font-semibold whitespace-nowrap min-w-[44px] transition-colors',
            activeTab === 'Venda'
              ? 'text-[#FF4444] border-b-2 border-[#FF4444]'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
          )}
        >
          🏢 Venda ({countVenda})
        </button>
        <button
          onClick={() => handleTabChange('Aluguel')}
          className={cn(
            'h-[48px] lg:h-[44px] px-1 flex items-center justify-center gap-2 font-semibold whitespace-nowrap min-w-[44px] transition-colors',
            activeTab === 'Aluguel'
              ? 'text-[#4444FF] border-b-2 border-[#4444FF]'
              : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent',
          )}
        >
          🏠 Aluguel ({countAluguel})
        </button>
      </div>

      <div className={cn('grid gap-4 grid-cols-1 lg:grid-cols-2', isPending && 'opacity-50')}>
        {sorted.map((demand) => (
          <DemandCard key={demand.id} demand={demand} />
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-muted/10 border border-dashed rounded-xl">
            <div className="text-4xl mb-4">
              {activeTab === 'Venda' ? '🏢' : activeTab === 'Aluguel' ? '🏠' : '📊'}
            </div>
            <p className="text-muted-foreground font-medium">
              {activeTab === 'all'
                ? 'Nenhuma demanda encontrada no momento.'
                : `Nenhuma demanda de ${activeTab} no momento.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
