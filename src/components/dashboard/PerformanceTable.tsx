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
    <Card className="border-0 shadow-md mb-6 w-full min-w-0 overflow-hidden flex flex-col">
      <CardHeader className="p-4 md:p-6 shrink-0 border-b bg-muted/10">
        <CardTitle className="text-base sm:text-lg font-bold leading-tight">
          Performance por SDR/Corretor
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-auto max-h-[500px]">
        <Table className="w-full min-w-[700px] relative">
          <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
            <TableRow className="h-[48px]">
              <TableHead className="font-semibold px-4">Nome</TableHead>
              <TableHead className="font-semibold px-4 text-center">Total</TableHead>
              <TableHead className="font-semibold px-4 text-center">Em Andamento</TableHead>
              <TableHead className="font-semibold px-4 text-center">Captadas</TableHead>
              <TableHead className="font-semibold px-4 text-center">Perdidas</TableHead>
              <TableHead className="font-semibold px-4 text-center">Visitas</TableHead>
              <TableHead className="font-semibold px-4 text-center">Negócios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} className="h-[48px] hover:bg-muted/40 transition-colors">
                <TableCell className="px-4 font-semibold text-foreground whitespace-nowrap">
                  {row.name}
                </TableCell>
                <TableCell className="px-4 text-center text-muted-foreground">
                  {row.total}
                </TableCell>
                <TableCell className="px-4 text-center text-muted-foreground">
                  {row.emAndamento}
                </TableCell>
                <TableCell className="px-4 text-center text-muted-foreground">
                  {row.captadas}
                </TableCell>
                <TableCell className="px-4 text-center text-muted-foreground">
                  {row.perdidas}
                </TableCell>
                <TableCell className="px-4 text-center text-muted-foreground">
                  {row.visitas}
                </TableCell>
                <TableCell className="px-4 text-center font-bold text-emerald-600 bg-emerald-50/30">
                  {row.negocios}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground h-[100px] font-medium"
                >
                  Nenhum dado encontrado para exibição.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
