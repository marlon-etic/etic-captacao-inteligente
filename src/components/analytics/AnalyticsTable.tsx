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
    <TableHead
      className="whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors"
      onClick={() => toggleSort(key)}
    >
      <div className="flex items-center gap-2 font-bold text-foreground">
        {label} <ArrowUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
      </div>
    </TableHead>
  )

  if (data.length === 0)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground text-center bg-background">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <Search className="w-10 h-10 opacity-30" />
        </div>
        <p className="text-[18px] font-bold text-foreground mb-1">Nenhuma demanda neste período</p>
        <p className="text-[14px]">Tente alterar os filtros aplicados para ver mais resultados.</p>
      </div>
    )

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-background">
      <div className="flex-1 overflow-auto p-0 m-0 w-full relative">
        <Table className="w-full min-w-[1000px]">
          <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10 shadow-sm border-b border-border">
            <TableRow className="h-[48px] lg:h-[56px]">
              {th('👤 Cliente', 'clientName')}
              {th('📍 Localização', 'location')}
              {th('🏷️ Tipo', 'type')}
              {th('💰 Orçamento', 'budget')}
              {th('📅 Abertura', 'createdAt')}
              <TableHead className="whitespace-nowrap font-bold text-foreground">
                📅 Finalização
              </TableHead>
              <TableHead className="whitespace-nowrap font-bold text-foreground">
                ⏱️ Tempo Aberto
              </TableHead>
              {th('🎯 Status', 'status')}
              <TableHead className="whitespace-nowrap font-bold text-foreground">
                💬 Motivo
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((d) => {
              const fDate = getFinalDate(d)
              return (
                <TableRow key={d.id} className="h-[56px] hover:bg-muted/40 transition-colors">
                  <TableCell
                    className="font-semibold text-foreground max-w-[180px] truncate"
                    title={d.clientName}
                  >
                    {d.clientName}
                  </TableCell>
                  <TableCell
                    className="max-w-[180px] truncate text-muted-foreground"
                    title={d.location}
                  >
                    {d.location}
                  </TableCell>
                  <TableCell className="font-medium">{d.type}</TableCell>
                  <TableCell className="font-medium text-foreground">
                    <span className="whitespace-nowrap text-muted-foreground">
                      R$ {(d.minBudget || 0).toLocaleString('pt-BR')}
                    </span>
                    <span className="mx-1 text-muted-foreground/50">-</span>
                    <span className="whitespace-nowrap font-semibold">
                      R$ {(d.maxBudget || d.budget || 0).toLocaleString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(d.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {fDate ? format(fDate, 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{getOpenTimeStr(d)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-muted text-foreground whitespace-nowrap shadow-sm border border-border/50">
                      {d.status}
                    </span>
                  </TableCell>
                  <TableCell
                    className="max-w-[200px] truncate text-muted-foreground"
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
        <div className="p-3 lg:p-4 border-t border-border flex items-center justify-center bg-muted/10 shrink-0 z-20">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[44px] px-4 font-semibold shadow-sm"
                >
                  Anterior
                </Button>
              </PaginationItem>
              <div className="px-6 text-[14px] font-bold text-muted-foreground">
                Página {page} de {pages}
              </div>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="min-h-[44px] px-4 font-semibold shadow-sm"
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
