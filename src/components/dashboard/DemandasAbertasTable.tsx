import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DemandasAbertasTable({ demandas }: { demandas: any[] }) {
  if (demandas.length === 0)
    return (
      <Card className="mb-8 border-gray-100 shadow-sm rounded-xl bg-white">
        <CardContent className="p-8 text-center text-emerald-600 font-bold text-lg">
          ✅ Sem demandas abertas! Você está em dia!
        </CardContent>
      </Card>
    )

  return (
    <Card className="mb-8 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black text-[#1A3A52]">
          🎯 Demandas Abertas (Foco Rápido)
        </CardTitle>
        <Badge variant="outline" className="font-bold text-gray-500 bg-white">
          {demandas.length} listadas
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-bold text-[#1A3A52]">Cliente</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Tipo</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Budget</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Bairros</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Specs</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Vinculado?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demandas.map((d) => (
                <TableRow key={d.id} className="hover:bg-blue-50 cursor-pointer transition-colors">
                  <TableCell className="font-bold text-gray-800">
                    {d.nome_cliente || d.cliente_nome}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-bold text-blue-700 bg-blue-50 border-blue-200"
                    >
                      {d.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      d.valor_maximo || 0,
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-600">
                    {d.bairros?.slice(0, 2).join(', ')}
                    {d.bairros?.length > 2 ? '...' : ''}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-gray-500 whitespace-nowrap">
                    {d.dormitorios || 0}D, {d.vagas_estacionamento || 0}V
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-amber-100 text-amber-800 border-none hover:bg-amber-100 uppercase tracking-wider text-[10px]">
                      {d.status_demanda}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {d.imovel_demand_match?.length > 0 ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none hover:bg-emerald-100">
                        ✅ Sim
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-bold">
                        Não
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
