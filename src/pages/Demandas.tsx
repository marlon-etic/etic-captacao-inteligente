import { useState } from 'react'
import { Filter, Activity } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DemandCard } from '@/components/DemandCard'
import useAppStore from '@/stores/useAppStore'

export default function Demandas() {
  const { demands, getSimilarDemands, webhookQueue, auditLogs, triggerCron } = useAppStore()
  const [search, setSearch] = useState('')

  const filtered = demands
    .filter(
      (d) =>
        d.clientName.toLowerCase().includes(search.toLowerCase()) ||
        d.location.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.isRepescagem && !b.isRepescagem) return -1
      if (!a.isRepescagem && b.isRepescagem) return 1
      const aTotal = getSimilarDemands(a.id).length + 1
      const bTotal = getSimilarDemands(b.id).length + 1
      if (aTotal >= 5 && bTotal < 5) return -1
      if (bTotal >= 5 && aTotal < 5) return 1
      if (aTotal !== bTotal) return bTotal - aTotal
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
                className="gap-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
              >
                <Activity className="w-4 h-4" /> Automação & Logs
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Console de Automação</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <Button onClick={triggerCron} className="w-full">
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
                          <p className="font-bold">{q.evento}</p>
                          <p className="text-muted-foreground line-clamp-2">{q.payload.message}</p>
                        </div>
                        <Badge
                          variant={
                            q.status === 'processed'
                              ? 'default'
                              : q.status === 'failed'
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
            className="max-w-[200px] bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((demand) => (
          <DemandCard key={demand.id} demand={demand} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">
            Nenhuma demanda encontrada.
          </p>
        )}
      </div>
    </div>
  )
}
