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
        <DialogHeader className="p-[16px] sm:p-[24px] border-b border-border shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] sm:gap-[24px] bg-muted/20">
          <div className="flex-1 pr-8 sm:pr-0">
            <DialogTitle className="text-[18px] sm:text-[20px] lg:text-[24px] font-black leading-tight text-foreground">
              {metric.title} - Período: {period}
            </DialogTitle>
            <DialogDescription className="text-[14px] sm:text-[15px] mt-2 font-medium">
              Análise detalhada ({metric.data.length} registros encontrados)
            </DialogDescription>
          </div>
          <div className="flex items-center gap-[12px]">
            <Button
              variant="default"
              onClick={handleExport}
              className="h-[48px] sm:h-[44px] px-[20px] text-[14px] font-bold shadow-sm"
            >
              <Download className="w-[18px] h-[18px] mr-2" /> Exportar em CSV
            </Button>
            <DialogClose asChild>
              <Button
                variant="outline"
                className="h-[48px] sm:h-[44px] px-[16px] hidden sm:flex text-[14px] font-bold shadow-sm"
              >
                Fechar
              </Button>
            </DialogClose>
          </div>
          <DialogClose className="absolute right-4 top-4 sm:hidden rounded-sm opacity-70 transition-opacity hover:opacity-100 p-2 bg-muted/50 text-foreground">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <div className="flex-1 overflow-hidden flex flex-col bg-background relative">
          <AnalyticsTable data={metric.data} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
