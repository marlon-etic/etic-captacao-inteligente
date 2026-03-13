import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Demand, User } from '@/types'

export function PerformanceTable({ demands, users }: { demands: Demand[]; users: User[] }) {
  const staff = users.filter((u) => u.role === 'sdr' || u.role === 'corretor')

  const data = staff
    .map((u) => {
      const userDemands = demands.filter((d) => d.createdBy === u.id || d.assignedTo === u.id)
      return {
        id: u.id,
        name: u.name,
        total: userDemands.length,
        emAndamento: userDemands.filter((d) =>
          ['Pendente', 'Em Captação', 'Aguardando'].includes(d.status),
        ).length,
        captadas: userDemands.filter((d) =>
          ['Captado sob demanda', 'Captado independente', 'Visita', 'Proposta', 'Negócio'].includes(
            d.status,
          ),
        ).length,
        perdidas: userDemands.filter((d) => ['Perdida', 'Impossível'].includes(d.status)).length,
        visitas: userDemands.filter((d) => ['Visita', 'Proposta', 'Negócio'].includes(d.status))
          .length,
        negocios: userDemands.filter((d) => d.status === 'Negócio').length,
      }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <Card className="border-0 shadow-md mb-[24px]">
      <CardHeader className="p-[16px]">
        <CardTitle className="text-[16px] leading-[24px]">Performance por SDR/Corretor</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="w-full min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-[12px] h-[48px] px-[12px]">Nome</TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">Total</TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">
                Em Andamento
              </TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">Captadas</TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">Perdidas</TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">Visitas</TableHead>
              <TableHead className="text-[12px] h-[48px] px-[12px] text-center">Negócios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="h-[48px]">
                <TableCell className="text-[12px] px-[12px] font-medium whitespace-nowrap">
                  {row.name}
                </TableCell>
                <TableCell className="text-[12px] px-[12px] text-center">{row.total}</TableCell>
                <TableCell className="text-[12px] px-[12px] text-center">
                  {row.emAndamento}
                </TableCell>
                <TableCell className="text-[12px] px-[12px] text-center">{row.captadas}</TableCell>
                <TableCell className="text-[12px] px-[12px] text-center">{row.perdidas}</TableCell>
                <TableCell className="text-[12px] px-[12px] text-center">{row.visitas}</TableCell>
                <TableCell className="text-[12px] px-[12px] text-center font-bold text-emerald-600">
                  {row.negocios}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground h-[48px] text-[12px]"
                >
                  Nenhum dado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
