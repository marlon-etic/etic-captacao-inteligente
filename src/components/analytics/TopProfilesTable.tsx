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
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getPriceRange(val: number) {
  if (val < 500000) return 'Até 500k'
  if (val < 1000000) return '500k - 1M'
  if (val < 2000000) return '1M - 2M'
  return 'Acima de 2M'
}

export function TopProfilesTable({
  demands,
  metric,
}: {
  demands: Demand[]
  metric: 'visits' | 'deals'
}) {
  const [page, setPage] = useState(1)
  const limit = 20
  const isVisits = metric === 'visits'

  const profiles = useMemo(() => {
    const map = new Map<string, any>()
    demands.forEach((d) => {
      const bairro = d.location.split(',')[0].trim() || 'Desconhecido'
      const val = d.maxBudget || d.budget || 0
      const faixa = getPriceRange(val)
      const key = `${bairro}-${faixa}-${d.bedrooms}-${d.parkingSpots}-${d.type}`

      if (!map.has(key)) {
        map.set(key, {
          bairro,
          faixa,
          dorm: d.bedrooms || 0,
          vagas: d.parkingSpots || 0,
          tipo: d.type,
          demandas: 0,
          visitas: 0,
          negocios: 0,
          valorTotal: 0,
        })
      }

      const p = map.get(key)
      p.demandas += 1

      let hasVisit = false
      let isDeal = false
      let dealValue = 0

      if (['Visita', 'Proposta', 'Negócio'].includes(d.status)) hasVisit = true
      if (d.status === 'Negócio') {
        isDeal = true
        dealValue = val
        d.capturedProperties?.forEach((cp) => {
          if (cp.fechamentoValue) dealValue = cp.fechamentoValue
        })
      }

      d.capturedProperties?.forEach((cp) => {
        if (cp.visitaDate) hasVisit = true
        if (cp.fechamentoDate) {
          isDeal = true
          if (cp.fechamentoValue) dealValue = cp.fechamentoValue
        }
      })

      if (hasVisit) p.visitas += 1
      if (isDeal) {
        p.negocios += 1
        p.valorTotal += dealValue
      }
    })
    return Array.from(map.values())
  }, [demands])

  const sorted = useMemo(
    () => profiles.sort((a, b) => (isVisits ? b.visitas - a.visitas : b.negocios - a.negocios)),
    [profiles, isVisits],
  )
  const paginated = sorted.slice((page - 1) * limit, page * limit)
  const pages = Math.max(1, Math.ceil(sorted.length / limit))

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(v)

  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col w-full overflow-hidden min-w-0">
      <div className="p-4 md:p-6 border-b bg-muted/20 shrink-0">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground leading-tight">
          {isVisits ? 'Bairros/Perfis com mais Visitas' : 'Bairros/Perfis com mais Negócios'}
        </h3>
      </div>
      <div className="w-full max-h-[500px] overflow-auto">
        <Table className="w-full min-w-[700px] relative">
          <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            <TableRow className="h-[48px]">
              <TableHead className="font-semibold">Bairro</TableHead>
              <TableHead className="font-semibold">Faixa de Valor</TableHead>
              <TableHead className="font-semibold">Dorm.</TableHead>
              <TableHead className="font-semibold">Vagas</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              {isVisits ? (
                <>
                  <TableHead className="font-semibold">Visitas</TableHead>
                  <TableHead className="font-semibold">Taxa Conv. (%)</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="font-semibold">Negócios</TableHead>
                  <TableHead className="font-semibold">Valor Total</TableHead>
                  <TableHead className="font-semibold">Valor Médio</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-[120px] text-center text-muted-foreground font-medium"
                >
                  Sem dados suficientes para exibir.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={i} className="h-[48px] hover:bg-muted/40 transition-colors">
                  <TableCell
                    className="font-medium text-foreground max-w-[150px] truncate"
                    title={row.bairro}
                  >
                    {row.bairro}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {row.faixa}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.dorm}</TableCell>
                  <TableCell className="text-muted-foreground">{row.vagas}</TableCell>
                  <TableCell className="text-muted-foreground">{row.tipo}</TableCell>
                  {isVisits ? (
                    <>
                      <TableCell className="font-bold text-primary">{row.visitas}</TableCell>
                      <TableCell className="font-medium">
                        {row.demandas > 0 ? ((row.visitas / row.demandas) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-bold text-emerald-600">{row.negocios}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {fmtCurrency(row.valorTotal)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.negocios > 0 ? fmtCurrency(row.valorTotal / row.negocios) : '-'}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="p-3 border-t bg-muted/10 shrink-0 flex items-center justify-center">
          <Pagination>
            <PaginationContent className="gap-2">
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-11 h-11 shadow-sm"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </PaginationItem>
              <span className="px-4 text-sm font-semibold text-muted-foreground" aria-live="polite">
                {page} / {pages}
              </span>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="w-11 h-11 shadow-sm"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
