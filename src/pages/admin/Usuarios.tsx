import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Search, UserPlus, Users as UsersIcon } from 'lucide-react'
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
import { UserDesktopRow, UserMobileCard } from '@/components/admin/UserListItems'
import { UserModal } from '@/components/admin/UserModal'
import useAppStore from '@/stores/useAppStore'
import { User } from '@/types'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Usuarios() {
  const { currentUser, users, updateUser, logAuthEvent, requestPasswordReset } = useAppStore()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/usuarios')
    }
  }, [currentUser, logAuthEvent])

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

  const handleToggleStatus = (u: User) => {
    if (u.id === currentUser.id) return
    const isInactive = u.status === 'inativo' || u.status === 'bloqueado'
    if (!isInactive) {
      if (window.confirm(`Desativar ${u.name}? Ele não poderá mais acessar o sistema.`)) {
        updateUser(u.id, { status: 'inativo' })
        toast({ title: 'Usuário desativado', variant: 'destructive' })
      }
    } else {
      updateUser(u.id, { status: 'ativo' })
      toast({ title: '✅ Reativado com sucesso!', className: 'bg-emerald-600 text-white' })
    }
  }

  const handleResetPassword = (u: User) => {
    if (window.confirm(`Enviar email de redefinição de senha para ${u.email}?`)) {
      requestPasswordReset(u.email)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      if (!matchSearch) return false
      if (activeFilter === 'todos') return true
      if (activeFilter === 'captadores') return u.role === 'captador'
      if (activeFilter === 'sdrs') return u.role === 'sdr'
      if (activeFilter === 'corretores') return u.role === 'corretor'
      if (activeFilter === 'admins') return u.role === 'admin'
      return true
    })
  }, [users, search, activeFilter])

  const activeCount = users.filter((u) => u.status === 'ativo').length

  const filterOptions = [
    { id: 'todos', label: 'Todos' },
    { id: 'captadores', label: 'Captadores' },
    { id: 'sdrs', label: 'SDRs' },
    { id: 'corretores', label: 'Corretores' },
    { id: 'admins', label: 'Admins' },
  ]

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

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
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
    </div>
  )
}
