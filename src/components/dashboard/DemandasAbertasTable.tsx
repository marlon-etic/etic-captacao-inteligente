import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export function DemandasAbertasTable({ demandas }: { demandas: any[] }) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const inicioSemana = new Date()
  inicioSemana.setDate(hoje.getDate() - hoje.getDay())
  inicioSemana.setHours(0, 0, 0, 0)

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const dHoje = demandas.filter((d) => new Date(d.created_at) >= hoje)
  const dSemana = demandas.filter((d) => new Date(d.created_at) >= inicioSemana)
  const dMes = demandas.filter((d) => new Date(d.created_at) >= inicioMes)

  const getUrgencyBadge = (dateStr: string) => {
    const diffDays = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24)
    if (diffDays <= 2)
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[9px]">
          NOVA
        </Badge>
      )
    if (diffDays <= 4)
      return (
        <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[9px]">
          MÉDIA
        </Badge>
      )
    return (
      <Badge className="bg-red-100 text-red-800 border-none font-bold text-[9px] animate-pulse">
        CRÍTICO
      </Badge>
    )
  }

  const getUrgencyDays = (dateStr: string) => {
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24),
    )
    return diffDays
  }

  const renderTable = (list: any[]) => {
    if (list.length === 0)
      return (
        <div className="p-8 text-center text-emerald-600 font-bold">
          ✅ Você está em dia neste período!
        </div>
      )

    return (
      <div className="overflow-x-auto min-h-[250px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead className="font-bold text-[#1A3A52]">Cliente / Tipo</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Budget</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((d) => (
              <TableRow key={d.id} className="hover:bg-blue-50/50 transition-colors">
                <TableCell className="font-bold text-gray-800">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{d.nome_cliente || d.cliente_nome}</span>
                    <div className="flex gap-1 items-center">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold text-blue-700 bg-blue-50 border-blue-200 px-1 py-0 uppercase"
                      >
                        {d.tipo}
                      </Badge>
                      <span className="text-[10px] text-gray-500 font-medium truncate max-w-[100px]">
                        {d.bairros?.slice(0, 2).join(', ')}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-emerald-600 text-xs">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(d.valor_maximo || 0)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap">
                      {d.dormitorios || 0}D, {d.vagas_estacionamento || 0}V
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    {getUrgencyBadge(d.created_at)}
                    <span className="text-[10px] text-gray-500 font-bold">
                      {getUrgencyDays(d.created_at)} dias aberto
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <Card className="border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white h-full flex flex-col">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
        <CardTitle className="text-lg font-black text-[#1A3A52]">🎯 Demandas Abertas</CardTitle>
        <CardDescription className="font-bold text-xs mt-1">
          Foco rápido nas prioridades
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Tabs defaultValue="semana" className="flex-1 flex flex-col">
          <div className="px-4 pt-4 shrink-0">
            <TabsList className="w-full grid grid-cols-3 bg-slate-100">
              <TabsTrigger
                value="hoje"
                className="font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Hoje
              </TabsTrigger>
              <TabsTrigger
                value="semana"
                className="font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Semana
              </TabsTrigger>
              <TabsTrigger
                value="mes"
                className="font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Mês
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="flex-1 overflow-auto">
            <TabsContent value="hoje" className="m-0 mt-2">
              {renderTable(dHoje)}
            </TabsContent>
            <TabsContent value="semana" className="m-0 mt-2">
              {renderTable(dSemana)}
            </TabsContent>
            <TabsContent value="mes" className="m-0 mt-2">
              {renderTable(dMes)}
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
