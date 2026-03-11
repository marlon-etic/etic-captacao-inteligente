import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { User, Demand } from '@/types'

export function RankingTable({ users, demands }: { users: User[]; demands: Demand[] }) {
  const [sortCol, setSortCol] = useState<'name' | 'total'>('total')
  const [sortDesc, setSortDesc] = useState(true)

  const tableData = useMemo(() => {
    const data = users.map((user) => {
      const userDemands = demands.filter((d) => d.assignedTo === user.id || d.createdBy === user.id)
      const total = userDemands.length
      const captados = userDemands.filter((d) =>
        ['Captado sob demanda', 'Captado independente', 'Visita', 'Negócio'].includes(d.status),
      ).length
      const visitas = userDemands.filter((d) => ['Visita', 'Negócio'].includes(d.status)).length
      const negocios = userDemands.filter((d) => d.status === 'Negócio').length
      const conversao = total > 0 ? Math.round((negocios / total) * 100) : 0

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        total,
        captados,
        visitas,
        negocios,
        conversao,
      }
    })

    return data.sort((a, b) => {
      let diff = 0
      if (sortCol === 'total') diff = a.total - b.total
      else if (sortCol === 'name') diff = a.name.localeCompare(b.name)
      return sortDesc ? -diff : diff
    })
  }, [users, demands, sortCol, sortDesc])

  const toggleSort = (col: 'name' | 'total') => {
    if (sortCol === col) setSortDesc(!sortDesc)
    else {
      setSortCol(col)
      setSortDesc(true)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Performance por Membro da Equipe</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('name')}
                  className="-ml-4 h-8 data-[state=open]:bg-accent"
                >
                  Nome <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => toggleSort('total')}
                  className="h-8 data-[state=open]:bg-accent"
                >
                  Total Demandas <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right hidden sm:table-cell">Captados</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Visitas</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Negócios</TableHead>
              <TableHead className="text-right hidden md:table-cell">Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="capitalize">{row.role}</TableCell>
                <TableCell className="text-right font-medium">{row.total}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{row.captados}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{row.visitas}</TableCell>
                <TableCell className="text-right hidden sm:table-cell">{row.negocios}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{row.conversao}%</TableCell>
              </TableRow>
            ))}
            {tableData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  Nenhum dado para exibir.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
