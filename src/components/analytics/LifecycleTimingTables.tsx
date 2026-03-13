import { useMemo } from 'react'
import { Demand } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function LifecycleTimingTables({ demands }: { demands: Demand[] }) {
  const { capToVis, visToDeal } = useMemo(() => {
    const map1 = new Map<string, number[]>()
    const map2 = new Map<string, number[]>()

    demands.forEach((d) => {
      const b = d.location.split(',')[0].trim() || 'Outro'
      const t = d.type
      const key = `${b}-${t}`

      d.capturedProperties?.forEach((cp) => {
        if (cp.capturedAt && cp.visitaDate) {
          const cap = new Date(cp.capturedAt).getTime()
          const vis = new Date(cp.visitaDate).getTime()
          const diff = (vis - cap) / (1000 * 3600 * 24)
          if (diff >= 0) {
            if (!map1.has(key)) map1.set(key, [])
            map1.get(key)!.push(diff)
          }
        }
        if (cp.visitaDate && cp.fechamentoDate) {
          const vis = new Date(cp.visitaDate).getTime()
          const fech = new Date(cp.fechamentoDate).getTime()
          const diff = (fech - vis) / (1000 * 3600 * 24)
          if (diff >= 0) {
            if (!map2.has(key)) map2.set(key, [])
            map2.get(key)!.push(diff)
          }
        }
      })
    })

    const agg = (m: Map<string, number[]>) =>
      Array.from(m.entries())
        .map(([k, arr]) => {
          const [bairro, tipo] = k.split('-')
          const min = Math.min(...arr)
          const max = Math.max(...arr)
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length
          return { bairro, tipo, min, max, avg }
        })
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10)

    return { capToVis: agg(map1), visToDeal: agg(map2) }
  }, [demands])

  const renderTable = (title: string, data: any[]) => (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden w-full">
      <div className="p-4 md:p-6 border-b bg-muted/10">
        <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold">{title}</h3>
      </div>
      <div className="flex-1 overflow-auto min-h-[300px]">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow>
              <TableHead>Bairro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tempo Médio (dias)</TableHead>
              <TableHead>Mínimo</TableHead>
              <TableHead>Máximo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Sem dados suficientes
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={i} className="min-h-[44px]">
                  <TableCell className="font-medium">{row.bairro}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  <TableCell className="font-bold">{row.avg.toFixed(1)}</TableCell>
                  <TableCell>{Math.floor(row.min)}</TableCell>
                  <TableCell>{Math.ceil(row.max)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {renderTable('Tempo: Captação até Visita', capToVis)}
      {renderTable('Tempo: Visita até Fechamento', visToDeal)}
    </div>
  )
}
