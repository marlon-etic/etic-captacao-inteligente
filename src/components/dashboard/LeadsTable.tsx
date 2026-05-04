import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { LeadDetailsModal } from './LeadDetailsModal'

export function LeadsTable({
  leads,
  loading,
  refetch,
}: {
  leads: any[]
  loading: boolean
  refetch: () => void
}) {
  const [selectedLead, setSelectedLead] = useState<any>(null)

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-2xl mb-8" />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fechado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'visitado':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'capturado':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'perdido':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const displayLeads = leads.slice(0, 10)

  return (
    <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 mb-8 overflow-hidden bg-white">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
        <CardTitle className="text-lg font-bold text-[#1A3A52]">
          Leads Recentes (Imóveis Captados)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayLeads.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-medium">
            Nenhum lead encontrado neste período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-bold text-[#1A3A52]">Código</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Endereço</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Valor</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Data</TableHead>
                  <TableHead className="font-bold text-[#1A3A52]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-bold text-gray-700">
                      {lead.codigo_imovel || 'S/N'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium text-gray-600">
                      {lead.endereco || 'Não informado'}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(lead.preco || lead.valor || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(lead.status_captacao)} uppercase text-[10px] font-bold px-2 py-0.5 tracking-wider`}
                      >
                        {lead.status_captacao || 'pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-500">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLead(lead)
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          refetch={refetch}
        />
      )}
    </Card>
  )
}
