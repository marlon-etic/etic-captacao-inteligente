import { Trophy } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getCaptadorColor, getCaptadorInitials } from '@/lib/captador-colors'
import type { TopCaptadorData } from '@/lib/campanha-historico-utils'
import { cn } from '@/lib/utils'

interface HistoricoTopCaptadoresProps {
  captadores: TopCaptadorData[]
}

export function HistoricoTopCaptadores({ captadores }: HistoricoTopCaptadoresProps) {
  const top10 = captadores.slice(0, 10)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
      <div className="p-4 border-b border-[#E5E5E5] bg-[#F5F5F5]">
        <h2 className="font-bold text-[#1A3A52] flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Top 10 Captadores
        </h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead>Captador</TableHead>
            <TableHead className="text-center">Capturas</TableHead>
            <TableHead className="text-center">Campanhas</TableHead>
            <TableHead className="text-center">Tx. Sucesso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {top10.map((cap, i) => {
            const color = getCaptadorColor(cap.captadorId)
            return (
              <TableRow key={cap.captadorId} className="hover:bg-[#F8FAFC] transition-colors">
                <TableCell className="text-center font-bold text-[#999999]">{i + 1}º</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                        color.bg,
                      )}
                    >
                      {getCaptadorInitials(cap.nome)}
                    </div>
                    <span className="font-bold text-[#1A3A52] text-sm">{cap.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">{cap.totalCapturas}</TableCell>
                <TableCell className="text-center">{cap.campanhasParticipadas}</TableCell>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold',
                      cap.successRate >= 50
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700',
                    )}
                  >
                    {cap.successRate.toFixed(0)}%
                  </span>
                </TableCell>
              </TableRow>
            )
          })}
          {top10.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-[#999999]">
                Nenhum captador encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
