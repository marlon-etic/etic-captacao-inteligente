import { Demand } from '@/types'
import { PerformanceChart } from './PerformanceChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollText } from 'lucide-react'

export function HistoricoTab({ userDemands }: { userDemands: Demand[] }) {
  const closedDemands = userDemands
    .filter((d) => ['Negócio', 'Perdida', 'Impossível'].includes(d.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="flex flex-col gap-[20px] animate-fade-in w-full transition-opacity duration-150 ease-in">
      <PerformanceChart userDemands={userDemands} />

      <Card className="shadow-sm border-[2px] border-[#E5E5E5] rounded-[12px] bg-white">
        <CardHeader className="bg-[#F5F5F5] border-b border-[#E5E5E5] pb-4 rounded-t-[10px]">
          <CardTitle className="text-[18px] font-bold text-[#1A3A52]">
            Histórico de Demandas Finalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {closedDemands.length === 0 ? (
            <div className="py-16 px-4 text-center text-[#999999] font-medium text-[16px] flex flex-col items-center justify-center bg-white rounded-b-[10px]">
              <div className="text-[64px] leading-none mb-4 opacity-50">📜</div>
              <p className="text-[#333333] font-bold text-[18px]">Nenhum histórico disponível</p>
              <p className="text-[14px] mt-1">As demandas finalizadas aparecerão aqui.</p>
            </div>
          ) : (
            <>
              {/* Mobile View */}
              <div className="md:hidden divide-y divide-[#E5E5E5] bg-white rounded-b-[10px]">
                {closedDemands.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 flex flex-col gap-2 hover:bg-[#F9F9F9] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[16px] text-[#333333] leading-tight">
                        {d.clientName}
                      </p>
                      <Badge
                        className="font-bold text-[12px] min-w-[80px] justify-center min-h-[28px]"
                        variant={d.status === 'Negócio' ? 'default' : 'secondary'}
                        style={{
                          backgroundColor: d.status === 'Negócio' ? '#4CAF50' : '#999999',
                          color: '#FFFFFF',
                          border: 'none',
                        }}
                      >
                        {d.status}
                      </Badge>
                    </div>
                    <div className="text-[14px] text-[#999999] leading-tight flex justify-between items-center">
                      <span>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
                      {d.lostReason && (
                        <span className="text-[12px] text-[#F44336] font-medium italic truncate max-w-[150px] text-right">
                          {d.lostReason}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block w-full">
                <ScrollArea className="w-full rounded-b-[10px] bg-white">
                  <Table className="w-full">
                    <TableHeader className="bg-[#F5F5F5] sticky top-0 z-10 shadow-[0_1px_0_#E5E5E5]">
                      <TableRow className="border-none hover:bg-transparent">
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Cliente
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Tipo
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Bairro
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Status
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Abertura
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Fechamento
                        </TableHead>
                        <TableHead className="font-bold text-[#1A3A52] whitespace-nowrap h-[48px]">
                          Motivo
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedDemands.map((d) => {
                        const closeDate =
                          d.status === 'Negócio'
                            ? d.capturedProperties?.find((p) => p.fechamentoDate)?.fechamentoDate
                            : d.data_perda

                        return (
                          <TableRow
                            key={d.id}
                            className="border-b border-[#E5E5E5] hover:bg-[#F9F9F9] transition-colors"
                          >
                            <TableCell className="font-medium text-[#333333] whitespace-nowrap h-[56px]">
                              {d.clientName}
                            </TableCell>
                            <TableCell className="text-[#333333] whitespace-nowrap h-[56px]">
                              {d.type}
                            </TableCell>
                            <TableCell
                              className="text-[#333333] whitespace-nowrap h-[56px] max-w-[200px] truncate"
                              title={d.location}
                            >
                              {d.location}
                            </TableCell>
                            <TableCell className="h-[56px]">
                              <Badge
                                className="font-bold text-[12px] justify-center min-h-[28px]"
                                variant={d.status === 'Negócio' ? 'default' : 'secondary'}
                                style={{
                                  backgroundColor: d.status === 'Negócio' ? '#4CAF50' : '#999999',
                                  color: '#FFFFFF',
                                  border: 'none',
                                }}
                              >
                                {d.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[#999999] whitespace-nowrap h-[56px]">
                              {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="text-[#999999] whitespace-nowrap h-[56px]">
                              {closeDate ? new Date(closeDate).toLocaleDateString('pt-BR') : '-'}
                            </TableCell>
                            <TableCell
                              className="text-[#333333] italic text-[13px] h-[56px] max-w-[200px] truncate"
                              title={d.lostReason || '-'}
                            >
                              {d.lostReason || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
