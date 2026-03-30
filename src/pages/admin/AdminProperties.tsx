import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Home as HomeIcon, Filter, Loader2, Trash2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { PropertyModal } from '@/components/admin/PropertyModal'
import { PropertyDesktopRow, PropertyMobileCard } from '@/components/admin/PropertyListItems'

export default function AdminProperties() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<any | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'single' | 'multiple'
    ids: string[]
  } | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (data?.role !== 'admin') {
        toast({ title: 'Acesso restrito a administradores', variant: 'destructive' })
        navigate('/app')
      } else {
        setIsAdmin(true)
        fetchProperties()
      }
    }
    checkAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchProperties = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('imoveis_captados')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Erro ao carregar imóveis', variant: 'destructive' })
    } else {
      const uIds = [
        ...new Set(data.map((p) => p.user_captador_id || p.captador_id).filter(Boolean)),
      ]
      if (uIds.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, nome').in('id', uIds)
        if (usersData) {
          const uMap = usersData.reduce((acc, u) => ({ ...acc, [u.id]: u.nome }), {})
          setUsersMap(uMap as Record<string, string>)
        }
      }
      setProperties(data)
    }
    setIsLoading(false)
  }

  const fetchSingleProperty = async (id: string) => {
    const { data } = await supabase.from('imoveis_captados').select('*').eq('id', id).single()
    if (data) {
      const uId = data.user_captador_id || data.captador_id
      if (uId && !usersMap[uId]) {
        const { data: uData } = await supabase
          .from('users')
          .select('id, nome')
          .eq('id', uId)
          .single()
        if (uData) setUsersMap((prev) => ({ ...prev, [uId]: uData.nome }))
      }
      setProperties((prev) => {
        const exists = prev.some((p) => p.id === id)
        if (exists) return prev.map((p) => (p.id === id ? data : p))
        return [data, ...prev]
      })
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    const channel = supabase
      .channel('admin_props_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            console.log('🔴 [ADMIN REALTIME] DELETE recebido:', payload)
            setProperties((prev) => prev.filter((p) => p.id !== payload.old.id))
            setSelectedIds((prev) => prev.filter((id) => id !== payload.old.id))
          } else {
            fetchSingleProperty(payload.new.id)
          }
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, usersMap])

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchSearch =
        (p.codigo_imovel || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.localizacao_texto || p.endereco || '').toLowerCase().includes(search.toLowerCase()) ||
        (usersMap[p.user_captador_id || p.captador_id] || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      if (!matchSearch) return false

      const status = (p.status_captacao || p.etapa_funil || '').toLowerCase()

      if (activeFilter === 'captados' && status !== 'capturado') return false
      if (activeFilter === 'em visita' && status !== 'visitado') return false
      if (activeFilter === 'fechados' && status !== 'fechado') return false

      if (statusFilter !== 'todos' && status !== statusFilter) return false

      return true
    })
  }, [properties, search, activeFilter, statusFilter, usersMap])

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredProperties.map((p) => p.id))
    else setSelectedIds([])
  }

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) setSelectedIds((prev) => [...prev, id])
    else setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  const handleCreate = () => {
    setEditingProperty(null)
    setModalOpen(true)
  }

  const handleEdit = (p: any) => {
    setEditingProperty(p)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setIsProcessing(true)
    try {
      const { error } = await supabase.from('imoveis_captados').delete().in('id', confirmDelete.ids)
      if (error) throw error
      toast({ title: '✅ Imóvel deletado com sucesso', className: 'bg-emerald-600 text-white' })
      setSelectedIds([])
    } catch (err: any) {
      toast({ title: 'Erro ao deletar imóvel. Tente novamente.', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
      setConfirmDelete(null)
    }
  }

  if (isAdmin === null || isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeCount = properties.length

  return (
    <div
      className={cn(
        'max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in-up',
        isProcessing && 'pointer-events-none opacity-80',
      )}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2E5F8A]/20 pb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
            <HomeIcon className="w-8 h-8 text-[#2E5F8A]" />
            Gestão de Imóveis
          </h1>
          <p className="text-[14px] text-[#999999] font-bold mt-1 uppercase tracking-wider">
            {activeCount} IMÓVEIS CADASTRADOS
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete({ type: 'multiple', ids: selectedIds })}
              className="min-h-[48px] px-6 font-bold shadow-md w-full sm:w-auto"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Deletar Selecionados ({selectedIds.length})
            </Button>
          )}
          <Button
            onClick={handleCreate}
            className="bg-[#4CAF50] hover:bg-[#388E3C] text-white min-h-[48px] px-6 font-bold w-full sm:w-auto shadow-md transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Imóvel
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'captados', label: 'Captados' },
            { id: 'em visita', label: 'Em Visita' },
            { id: 'fechados', label: 'Fechados' },
          ].map((f) => (
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="capturado">Capturado</SelectItem>
                <SelectItem value="visitado">Visitado</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#999999]" />
            <Input
              placeholder="Buscar código, bairro..."
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
              <TableHead className="w-[50px] text-center">
                <Checkbox
                  checked={
                    filteredProperties.length > 0 &&
                    selectedIds.length === filteredProperties.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-bold text-[#1A3A52]">ID / Código</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Tipo</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Preço</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Bairro</TableHead>
              <TableHead className="font-bold text-[#1A3A52] text-center">Dorm.</TableHead>
              <TableHead className="font-bold text-[#1A3A52] text-center">Vagas</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Captador</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Data</TableHead>
              <TableHead className="font-bold text-[#1A3A52]">Status</TableHead>
              <TableHead className="text-right font-bold text-[#1A3A52]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-[#999999] font-medium">
                  Nenhum imóvel encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProperties.map((p) => (
                <PropertyDesktopRow
                  key={p.id}
                  property={p}
                  userName={usersMap[p.user_captador_id || p.captador_id]}
                  isSelected={selectedIds.includes(p.id)}
                  onSelect={(c) => handleSelectOne(c as boolean, p.id)}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => setConfirmDelete({ type: 'single', ids: [p.id] })}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredProperties.map((p) => (
          <PropertyMobileCard
            key={p.id}
            property={p}
            userName={usersMap[p.user_captador_id || p.captador_id]}
            isSelected={selectedIds.includes(p.id)}
            onSelect={(c) => handleSelectOne(c as boolean, p.id)}
            onEdit={() => handleEdit(p)}
            onDelete={() => setConfirmDelete({ type: 'single', ids: [p.id] })}
          />
        ))}
      </div>

      <Button
        onClick={handleCreate}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4CAF50] hover:bg-[#388E3C] text-white shadow-lg p-0 flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        property={editingProperty}
      />

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && !isProcessing && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-[#333333] text-[16px]">
            <p>
              Você tem certeza que deseja deletar
              <strong>
                {' '}
                {confirmDelete?.ids.length === 1
                  ? 'este imóvel'
                  : `${confirmDelete?.ids.length} imóveis`}
              </strong>
              ? Esta ação é irreversível e excluirá em cascata todos os registros associados
              (visitas, negócios).
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sim, deletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
