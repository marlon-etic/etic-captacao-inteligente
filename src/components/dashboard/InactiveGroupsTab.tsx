import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, MapPin, DollarSign, Bed, Users, Calendar, Flag } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useIsMobile } from '@/hooks/use-mobile'

export function InactiveGroupsTab() {
  const { inactiveGroups } = useAppStore()
  const isMobile = useIsMobile()
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('30d')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)

  const filteredGroups = useMemo(() => {
    const now = new Date().getTime()
    return inactiveGroups
      .filter((g) => {
        if (statusFilter !== 'all' && g.outcome !== statusFilter) return false

        const closedTime = new Date(g.closedAt).getTime()
        if (periodFilter === '7d' && now - closedTime > 7 * 86400000) return false
        if (periodFilter === '30d' && now - closedTime > 30 * 86400000) return false

        return true
      })
      .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime())
  }, [inactiveGroups, statusFilter, periodFilter])

  return (
    <div className="flex flex-col space-y-6 w-full animate-fade-in">
      <Card className="border-0 shadow-md">
        <CardHeader className="p-4 md:p-6 shrink-0 border-b bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2 text-[#1A3A52]">
            <Flag className="w-5 h-5" />
            Histórico de Grupos
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-[44px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Atendido">Atendidos</SelectItem>
                <SelectItem value="Perdido">Perdidos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-[44px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <AlertCircle className="w-12 h-12 mb-4 opacity-30 text-[#1A3A52]" />
              <p className="text-[#1A3A52] text-lg font-bold">
                Nenhum histórico encontrado para este período.
              </p>
              <p className="text-sm text-[#999999] mt-1">
                Altere os filtros acima para ver mais resultados.
              </p>
            </div>
          ) : isMobile ? (
            <div className="flex flex-col gap-4 p-4">
              {filteredGroups.map((g) => (
                <div
                  key={g.id}
                  className="border-[2px] border-[#E5E5E5] rounded-xl p-4 bg-[#F9F9F9] flex flex-col gap-3 grayscale-[0.3] opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="flex justify-between items-start gap-2">
                    <Badge
                      variant="outline"
                      className="bg-white border-[#E5E5E5] text-[#333333] font-bold text-[11px] px-2 shrink-0"
                    >
                      {g.type}
                    </Badge>
                    <Badge
                      className="font-bold text-[11px] shrink-0"
                      variant={g.outcome === 'Atendido' ? 'default' : 'destructive'}
                      style={{
                        backgroundColor: g.outcome === 'Atendido' ? '#4CAF50' : '#F44336',
                        color: '#FFF',
                        border: 'none',
                      }}
                    >
                      {g.outcome}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <p className="font-bold text-[16px] text-[#1A3A52] flex items-center gap-1.5 leading-tight">
                      <MapPin className="w-4 h-4 shrink-0" /> {g.location}
                    </p>
                    <p className="font-bold text-[15px] text-[#333333] flex items-center gap-1.5 leading-tight">
                      <DollarSign className="w-4 h-4 text-[#1A3A52] shrink-0" />{' '}
                      {formatCurrency(g.minBudget)} - {formatCurrency(g.maxBudget)}
                    </p>
                    <p className="text-[13px] text-[#333333] flex items-center gap-1.5 leading-tight">
                      <Bed className="w-4 h-4 text-[#1A3A52] shrink-0" /> {g.bedrooms} dorm,{' '}
                      {g.bathrooms} banh, {g.parkingSpots} vagas
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1 pt-3 border-t border-[#E5E5E5]">
                      <span className="text-[12px] font-medium text-[#333333] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> {g.totalClients} clientes
                      </span>
                      <span className="text-[12px] font-medium text-[#333333] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />{' '}
                        {new Date(g.closedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table className="w-full min-w-[800px]">
              <TableHeader className="bg-[#F5F5F5] sticky top-0 z-10 shadow-sm">
                <TableRow className="h-[48px]">
                  <TableHead className="font-semibold px-6 py-4">Bairro / Tipo</TableHead>
                  <TableHead className="font-semibold px-4 py-4 text-left">
                    Valor (Min - Máx)
                  </TableHead>
                  <TableHead className="font-semibold px-4 py-4 text-center">Perfil</TableHead>
                  <TableHead className="font-semibold px-4 py-4 text-center">Clientes</TableHead>
                  <TableHead className="font-semibold px-4 py-4 text-center">
                    Encerramento
                  </TableHead>
                  <TableHead className="font-semibold px-6 py-4 text-right">Motivo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((g) => (
                  <TableRow
                    key={g.id}
                    className="hover:bg-[#F9F9F9] transition-colors h-[60px] grayscale-[0.2] opacity-90 hover:opacity-100"
                  >
                    <TableCell className="px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1A3A52] flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#1A3A52]" /> {g.location}
                        </span>
                        <span className="text-[12px] text-[#999999] ml-[22px]">{g.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 font-bold text-[#333333]">
                      {formatCurrency(g.minBudget)} - {formatCurrency(g.maxBudget)}
                    </TableCell>
                    <TableCell className="px-4 text-center text-[#333333] text-[13px]">
                      {g.bedrooms} dorm / {g.parkingSpots} vagas
                    </TableCell>
                    <TableCell className="px-4 text-center text-[#333333] font-medium">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-4 h-4 text-[#999999]" /> {g.totalClients}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center text-[#999999] text-[13px] font-medium">
                      {new Date(g.closedAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <Badge
                        className="font-bold text-[12px] px-3 py-1"
                        variant={g.outcome === 'Atendido' ? 'default' : 'destructive'}
                        style={{
                          backgroundColor: g.outcome === 'Atendido' ? '#4CAF50' : '#F44336',
                          color: '#FFF',
                          border: 'none',
                        }}
                      >
                        {g.outcome}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
