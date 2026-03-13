import { useState, useMemo } from 'react'
import { Demand } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Search } from 'lucide-react'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { format } from 'date-fns'

function getFinalDate(d: Demand) {
  if (d.status === 'Negócio') {
    const cp = d.capturedProperties?.find((p) => p.fechamentoDate)
    if (cp?.fechamentoDate) return new Date(cp.fechamentoDate)
  }
  return null
}

function getOpenTimeStr(d: Demand) {
  const start = new Date(d.createdAt).getTime()
  const end = getFinalDate(d)?.getTime() || Date.now()
  const diffH = Math.floor((end - start) / 3600000)
  if (diffH < 24) return `${diffH} horas`
  return `${Math.floor(diffH / 24)} dias`
}

export function AnalyticsTable({ data }: { data: Demand[] }) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: string; asc: boolean }>({ key: 'createdAt', asc: false })
  const limit = 20

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA: any = a[sort.key as keyof Demand]
      let valB: any = b[sort.key as keyof Demand]
      if (sort.key === 'budget') {
        valA = a.maxBudget || a.budget || 0
        valB = b.maxBudget || b.budget || 0
      }
      if (valA < valB) return sort.asc ? -1 : 1
      if (valA > valB) return sort.asc ? 1 : -1
      return 0
    })
  }, [data, sort])

  const paginated = sorted.slice((page - 1) * limit, page * limit)
  const pages = Math.ceil(sorted.length / limit)

  const toggleSort = (k: string) => {
    setSort((p) => ({ key: k, asc: p.key === k ? !p.asc : true }))
    setPage(1)
  }

  const th = (label: string, key: string) => (
    <TableHead className="whitespace-nowrap px-4">
      <button
        onClick={() => toggleSort(key)}
        className="flex items-center gap-2 font-bold text-foreground w-full py-2 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        aria-label={`Ordenar por ${label}`}
      >
        {label} <ArrowUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" aria-hidden="true" />
      </button>
    </TableHead>
  )

  if (data.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-muted-foreground text-center bg-background w-full">
        <div
          className="w-16 h-16 md:w-20 md:h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4"
          aria-hidden="true"
        >
          <Search className="w-8 h-8 md:w-10 md:h-10 opacity-30" />
        </div>
        <p className="text-base md:text-lg font-bold text-foreground mb-1">
          Nenhuma demanda neste período
        </p>
        <p className="text-sm">Tente alterar os filtros aplicados para ver mais resultados.</p>
      </div>
    )

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-auto w-full max-h-[calc(85vh-160px)] relative">
        <Table className="w-full min-w-[1000px] relative">
          <TableHeader className="sticky top-0 bg-card z-20 shadow-[0_1px_2px_rgba(0,0,0,0.1)] m-0 p-0 border-b border-border before:absolute before:inset-0 before:bg-background before:-z-10">
            <TableRow className="h-[48px] hover:bg-transparent">
              {th('👤 Cliente', 'clientName')}
              {th('📍 Localização', 'location')}
              {th('🏷️ Tipo', 'type')}
              {th('💰 Orçamento', 'budget')}
              {th('📅 Abertura', 'createdAt')}
              <TableHead className="whitespace-nowrap font-bold text-foreground px-4">
                📅 Finalização
              </TableHead>
              <TableHead className="whitespace-nowrap font-bold text-foreground px-4">
                ⏱️ Tempo Aberto
              </TableHead>
              {th('🎯 Status', 'status')}
              <TableHead className="whitespace-nowrap font-bold text-foreground px-4">
                💬 Motivo
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((d) => {
              const fDate = getFinalDate(d)
              return (
                <TableRow key={d.id} className="h-[48px] hover:bg-muted/40 transition-colors">
                  <TableCell
                    className="font-semibold text-foreground max-w-[180px] truncate px-4"
                    title={d.clientName}
                  >
                    {d.clientName}
                  </TableCell>
                  <TableCell
                    className="max-w-[180px] truncate text-muted-foreground px-4"
                    title={d.location}
                  >
                    {d.location}
                  </TableCell>
                  <TableCell className="font-medium px-4">{d.type}</TableCell>
                  <TableCell className="font-medium text-foreground px-4">
                    <span className="whitespace-nowrap text-muted-foreground">
                      R$ {(d.minBudget || 0).toLocaleString('pt-BR')}
                    </span>
                    <span className="mx-1 text-muted-foreground/50">-</span>
                    <span className="whitespace-nowrap font-semibold">
                      R$ {(d.maxBudget || d.budget || 0).toLocaleString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 whitespace-nowrap">
                    {format(new Date(d.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground px-4 whitespace-nowrap">
                    {fDate ? format(fDate, 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium px-4 whitespace-nowrap">
                    {getOpenTimeStr(d)}
                  </TableCell>
                  <TableCell className="px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-muted text-foreground whitespace-nowrap shadow-sm border border-border/50">
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate text-muted-foreground px-4"
                    title={d.lostReason}
                  >
                    {d.lostReason || '-'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="p-3 border-t border-border flex items-center justify-center bg-muted/10 shrink-0 z-20 w-full">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[44px] h-[44px] px-4 font-semibold shadow-sm"
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>
              </PaginationItem>
              <div
                className="px-4 sm:px-6 text-sm font-bold text-muted-foreground"
                aria-live="polite"
              >
                Página {page} de {pages}
              </div>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="min-h-[44px] h-[44px] px-4 font-semibold shadow-sm"
                  aria-label="Próxima página"
                >
                  Próxima
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
