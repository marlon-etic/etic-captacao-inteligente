import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { UsersCog, Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { Role } from '@/types'
import { toast } from '@/hooks/use-toast'

export function Usuarios() {
  const { currentUser, users, updateUser, logAuthEvent } = useAppStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/usuarios')
    }
  }, [currentUser, logAuthEvent])

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  const handleRoleChange = (userId: string, newRole: Role) => {
    if (userId === currentUser.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode alterar seu próprio nível de acesso.',
        variant: 'destructive',
      })
      return
    }
    updateUser(userId, { role: newRole })
    toast({
      title: 'Permissão atualizada',
      description: 'O nível de acesso foi alterado com sucesso.',
    })
  }

  const handleStatusToggle = (userId: string, active: boolean) => {
    if (userId === currentUser.id) {
      toast({
        title: 'Ação não permitida',
        description: 'Você não pode bloquear sua própria conta.',
        variant: 'destructive',
      })
      return
    }
    updateUser(userId, { status: active ? 'ativo' : 'bloqueado' })
    toast({
      title: active ? 'Usuário Ativado' : 'Usuário Bloqueado',
      description: active
        ? 'O usuário pode acessar o sistema.'
        : 'O acesso do usuário foi revogado.',
      variant: active ? 'default' : 'destructive',
    })
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="flex flex-col gap-2 border-b border-[#2E5F8A]/20 pb-4">
        <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
          <UsersCog className="w-8 h-8 text-[#2E5F8A]" />
          Gestão de Usuários
        </h1>
        <p className="text-[14px] text-[#999999] font-medium">
          Controle de acesso, perfis e status das contas em tempo real.
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="bg-muted/10 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Todos os Usuários</CardTitle>
            <CardDescription>Gerencie as permissões e bloqueios ativamente.</CardDescription>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Usuário</TableHead>
                  <TableHead>Perfil (Role)</TableHead>
                  <TableHead>Pontuação</TableHead>
                  <TableHead>Status da Conta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(val) => handleRoleChange(user.id, val as Role)}
                          disabled={user.id === currentUser.id}
                        >
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="corretor">Corretor</SelectItem>
                            <SelectItem value="sdr">SDR</SelectItem>
                            <SelectItem value="captador">Captador</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.points} pts</span>
                          {user.badges && user.badges.length > 0 && (
                            <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[120px]">
                              {user.badges.join(', ')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={user.status !== 'bloqueado' && user.status !== 'inativo'}
                            onCheckedChange={(c) => handleStatusToggle(user.id, c)}
                            disabled={user.id === currentUser.id}
                          />
                          <Badge
                            variant={
                              user.status === 'bloqueado' || user.status === 'inativo'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {user.status === 'bloqueado' || user.status === 'inativo'
                              ? 'Bloqueado'
                              : 'Ativo'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
