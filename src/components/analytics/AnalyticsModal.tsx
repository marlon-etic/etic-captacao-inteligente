import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { AnalyticsTable } from './AnalyticsTable'
import { AnalyticsFilterState } from '@/pages/analytics/AnalyticsDashboard'
import { Demand } from '@/types'
import { exportToCSV } from '@/lib/exportToCSV'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Download, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  metric: { id: string; title: string; data: Demand[] } | null
  filters: AnalyticsFilterState
}

export function AnalyticsModal({ open, onClose, metric, filters }: Props) {
  if (!metric) return null

  let period = 'Todo o período'
  if (filters.startDate && filters.endDate) {
    period = `${format(new Date(filters.startDate), 'dd/MM/yyyy')} a ${format(new Date(filters.endDate), 'dd/MM/yyyy')}`
  } else if (filters.startDate) {
    period = `A partir de ${format(new Date(filters.startDate), 'dd/MM/yyyy')}`
  } else if (filters.endDate) {
    period = `Até ${format(new Date(filters.endDate), 'dd/MM/yyyy')}`
  }

  const handleExport = () => {
    const rows = metric.data.map((d) => ({
      Cliente: d.clientName,
      Localizacao: d.location,
      Tipo: d.type,
      OrcamentoMin: d.minBudget || 0,
      OrcamentoMax: d.maxBudget || d.budget || 0,
      DataAbertura: format(new Date(d.createdAt), 'dd/MM/yyyy'),
      Status: d.status,
      Motivo: d.lostReason || '-',
    }))
    exportToCSV(`Relatorio_${metric.id}_${new Date().getTime()}.csv`, rows)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[1200px] w-full h-[100dvh] sm:h-[85vh] p-0 flex flex-col rounded-none sm:rounded-2xl overflow-hidden bg-background border-0 shadow-2xl">
        <DialogHeader className="p-4 sm:p-6 border-b border-border shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 w-full relative">
          <div className="flex-1 pr-12 sm:pr-0">
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-black leading-tight text-foreground">
              {metric.title} - Período: {period}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base mt-1 font-medium">
              Análise detalhada ({metric.data.length} registros encontrados)
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              onClick={handleExport}
              className="min-h-[44px] h-[44px] px-4 text-sm font-bold shadow-sm w-full sm:w-auto"
              aria-label="Exportar tabela para CSV"
            >
              <Download className="w-[18px] h-[18px] mr-2" aria-hidden="true" /> Exportar em CSV
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="min-h-[44px] h-[44px] px-4 hidden sm:flex text-sm font-bold shadow-sm"
                aria-label="Fechar modal"
              >
                Fechar
              </Button>
            </DialogClose>
          </div>
          <DialogClose
            className="absolute right-3 top-3 sm:hidden rounded-sm opacity-70 transition-opacity hover:opacity-100 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-muted/50 text-foreground"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col bg-background relative w-full">
          <AnalyticsTable data={metric.data} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
