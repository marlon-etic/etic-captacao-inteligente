import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'

export function RankingTable({ users }: { users: User[] }) {
  const sortedUsers = useMemo(() => [...users].sort((a, b) => b.points - a.points), [users])

  const mockDetails = (index: number) => ({
    captados: Math.max(0, 15 - index * 2),
    conversao: Math.max(0, 35 - index * 3),
    badges:
      index === 0
        ? ['🏆 Ouro', '⚡ Rápido']
        : index === 1
          ? ['🥈 Prata']
          : index === 2
            ? ['🥉 Bronze']
            : ['🎯 Foco'],
  })

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Ranking Mensal</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Pos</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Imóveis Captados</TableHead>
              <TableHead className="text-right hidden md:table-cell">Conversão</TableHead>
              <TableHead className="hidden sm:table-cell">Badges</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, idx) => {
              const details = mockDetails(idx)
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-center">{idx + 1}º</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-right">{user.points}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {details.captados}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {details.conversao}%
                  </TableCell>
                  <TableCell className="space-x-1 hidden sm:table-cell">
                    {details.badges.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs font-normal">
                        {b}
                      </Badge>
                    ))}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
