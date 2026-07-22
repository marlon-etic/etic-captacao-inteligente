import { useState, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { NegotiationDetailsModal } from '@/components/sdr-dashboard/NegotiationDetailsModal'

function NegotiationsListBase({ data }: { data: any }) {
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null)

  const negociacoesList = Array.isArray(data?.negociacoes) ? data.negociacoes : []

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="font-black text-[#1A3A52] text-lg">Negociações</h2>
          <Badge variant="outline" className="bg-white font-bold">
            {negociacoesList.length} registros
          </Badge>
        </div>
        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-xs h-10">
                  Imóvel
                </TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-xs h-10">
                  Data
                </TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-xs h-10">
                  Status
                </TableHead>
                <TableHead className="font-bold text-gray-500 uppercase tracking-wider text-xs h-10">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negociacoesList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-12 text-gray-400 font-bold bg-white"
                  >
                    Nenhuma negociação registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                negociacoesList.map((n: any) => {
                  const property = n.imovel_demand_match?.imoveis_captados
                  const address =
                    property?.endereco ||
                    property?.localizacao_texto ||
                    property?.codigo_imovel ||
                    'N/A'
                  const isNegotiated = n.negotiation_status === 'negotiated'
                  return (
                    <TableRow key={n.id} className="hover:bg-gray-50">
                      <TableCell className="font-bold text-gray-800">
                        {address}
                        {property?.codigo_imovel && (
                          <span className="block text-xs text-gray-400">
                            {property.codigo_imovel}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap">
                        {format(new Date(n.negotiation_date || n.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isNegotiated
                              ? 'bg-emerald-100 text-emerald-800 border-none font-bold uppercase tracking-wider text-[10px]'
                              : 'bg-red-100 text-red-800 border-none font-bold uppercase tracking-wider text-[10px]'
                          }
                        >
                          {isNegotiated ? 'Fechado' : 'Falhou'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 font-bold"
                          onClick={() => setSelectedNegotiation(n)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <NegotiationDetailsModal
        negotiation={selectedNegotiation}
        open={!!selectedNegotiation}
        onOpenChange={(open) => !open && setSelectedNegotiation(null)}
      />
    </>
  )
}

export const NegotiationsList = memo(NegotiationsListBase)
