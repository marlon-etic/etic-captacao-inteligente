import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, UserPlus, Users as UsersIcon, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserDesktopRow, UserMobileCard } from '@/components/admin/UserListItems'
import { UserModal } from '@/components/admin/UserModal'
import useAppStore from '@/stores/useAppStore'
import { User } from '@/types'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type ConfirmAction = {
  type: 'deactivate' | 'reactivate' | 'reset'
  user: User
} | null

export function Usuarios() {
  const { currentUser, users, updateUser, logAuthEvent, requestPasswordReset } = useAppStore()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/usuarios')
    }
  }, [currentUser, logAuthEvent])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      if (!matchSearch) return false

      if (activeFilter !== 'todos') {
        if (activeFilter === 'captadores' && u.role !== 'captador') return false
        if (activeFilter === 'sdrs' && u.role !== 'sdr') return false
        if (activeFilter === 'corretores' && u.role !== 'corretor') return false
        if (activeFilter === 'admins' && u.role !== 'admin') return false
      }

      if (statusFilter === 'ativos' && u.status !== 'ativo') return false
      if (statusFilter === 'inativos' && u.status === 'ativo') return false

      return true
    })
  }, [users, search, activeFilter, statusFilter])

  const activeCount = users.filter((u) => u.status === 'ativo').length

  const filterOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'captadores', label: 'Captadores' },
    { id: 'sdrs', label: 'SDRs' },
    { id: 'corretores', label: 'Corretores' },
    { id: 'admins', label: 'Admins' },
  ]

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  const handleEdit = (u: User) => {
    setEditingUser(u)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  const handleToggleStatus = (u: User, forceAction?: 'deactivate' | 'reactivate') => {
    if (u.id === currentUser.id) return
    const isInactive = u.status === 'inativo' || u.status === 'bloqueado'
    const actionType = forceAction || (isInactive ? 'reactivate' : 'deactivate')
    setConfirmAction({ type: actionType, user: u })
  }

  const handleResetPassword = (u: User) => {
    setConfirmAction({ type: 'reset', user: u })
  }

  const executeConfirmAction = async () => {
    if (!confirmAction) return

    const { type, user } = confirmAction
    try {
      if (type === 'reset') {
        await requestPasswordReset(user.email)
        toast({
          title: `✅ Email de redefinição enviado para ${user.email}`,
          className: 'bg-emerald-600 text-white',
        })
      } else if (type === 'deactivate') {
        updateUser(user.id, { status: 'inativo' })
        toast({ title: `⚫ ${user.name} foi desativado`, variant: 'destructive' })
      } else if (type === 'reactivate') {
        updateUser(user.id, { status: 'ativo' })
        toast({
          title: `✅ ${user.name} foi reativado`,
          className: 'bg-emerald-600 text-white',
        })
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2E5F8A]/20 pb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-[#2E5F8A]" />
            Gestão de Usuários
          </h1>
          <p className="text-[14px] text-[#999999] font-bold mt-1 uppercase tracking-wider">
            {activeCount} usuários ativos
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-[#4CAF50] hover:bg-[#388E3C] text-white min-h-[48px] px-6 font-bold w-full sm:w-auto shadow-md"
        >
          <UserPlus className="w-5 h-5 mr-2" /> Novo Usuário
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {filterOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                'px-4 py-2 rounded-full text-[13px] font-bold transition-colors border',
                activeFilter === f.id
                  ? 'bg-[#1A3A52] text-white border-[#1A3A52]'
                  : 'bg-transparent text-[#666666] border-[#E5E5E5] hover:border-[#1A3A52] hover:text-[#1A3A52]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-[220px]">
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativos">Ativos</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 min-h-[44px]"
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F5F5F5]">
            <TableRow>
              <TableHead className="font-bold text-[#1A3A52]">Usuário</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Perfil</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">WhatsApp</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Data Cadastro</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
              <TableHead className="text-right font-bold text-[#1A3A52]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-[#999999] font-medium">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <UserDesktopRow
                  key={u.id}
                  user={u}
                  onEdit={handleEdit}
                  onToggleStatus={handleToggleStatus}
                  onResetPassword={handleResetPassword}
                  isCurrentUser={u.id === currentUser.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-[#999999] font-medium bg-white rounded-xl border border-[#E5E5E5]">
            Nenhum usuário encontrado.
          </div>
        ) : (
          filteredUsers.map((u) => (
            <UserMobileCard
              key={u.id}
              user={u}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onResetPassword={handleResetPassword}
              isCurrentUser={u.id === currentUser.id}
            />
          ))
        )}
      </div>

      <UserModal isOpen={modalOpen} onClose={() => setModalOpen(false)} user={editingUser} />

      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#1A3A52]">
              {confirmAction?.type === 'reset' && 'Resetar Senha'}
              {confirmAction?.type === 'deactivate' && 'Desativar Usuário'}
              {confirmAction?.type === 'reactivate' && 'Reativar Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-[#333333] text-[16px]">
            {confirmAction?.type === 'reset' && (
              <p>
                Enviar email de redefinição de senha para{' '}
                <strong>{confirmAction.user.email}</strong>?
              </p>
            )}
            {confirmAction?.type === 'deactivate' && (
              <p>
                Desativar <strong>{confirmAction.user.name}</strong>? Ele não poderá mais acessar o
                sistema.
              </p>
            )}
            {confirmAction?.type === 'reactivate' && (
              <p>
                Reativar o acesso de <strong>{confirmAction.user.name}</strong> ao sistema?
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            {confirmAction?.type === 'reset' && (
              <Button
                className="bg-[#2196F3] hover:bg-[#1E88E5] text-white"
                onClick={executeConfirmAction}
              >
                Enviar Email
              </Button>
            )}
            {confirmAction?.type === 'deactivate' && (
              <Button variant="destructive" onClick={executeConfirmAction}>
                Desativar
              </Button>
            )}
            {confirmAction?.type === 'reactivate' && (
              <Button
                className="bg-[#4CAF50] hover:bg-[#388E3C] text-white"
                onClick={executeConfirmAction}
              >
                Reativar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
