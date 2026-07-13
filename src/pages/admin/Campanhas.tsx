import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Megaphone, Plus, Loader2, Filter, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CampanhaCard } from '@/components/campanhas/CampanhaCard'
import { NewCampanhaModal } from '@/components/campanhas/NewCampanhaModal'
import { CampanhaDetailsModal } from '@/components/campanhas/CampanhaDetailsModal'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  Campanha,
  fetchCampanhas,
  updateCampanhaStatus,
  closeCampanha,
} from '@/services/campanhaService'
import { CampanhaHistoricoDashboard } from '@/components/campanhas/CampanhaHistoricoDashboard'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function Campanhas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showHistory, setShowHistory] = useState(false)

  const role = user?.user_metadata?.role || user?.app_metadata?.role
  const isOwner =
    user?.email === 'marlonjmoro@hotmail.com' || user?.email === 'marlon@eticimoveis.com.br'

  const loadCampanhas = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchCampanhas()
      setCampanhas(data)
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (role === 'admin' || isOwner) {
      loadCampanhas()
    }
  }, [role, isOwner, loadCampanhas])

  useEffect(() => {
    if (role !== 'admin' && !isOwner) return
    const channel = supabase
      .channel('campanhas_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas' }, () =>
        loadCampanhas(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas_imoveis' }, () =>
        loadCampanhas(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [role, isOwner, loadCampanhas])

  if (role !== 'admin' && !isOwner) {
    return <Navigate to="/app" replace />
  }

  const handleToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ativa' ? 'pausada' : 'ativa'
    try {
      await updateCampanhaStatus(id, newStatus)
      setCampanhas((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)))
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleClose = async (id: string) => {
    try {
      await closeCampanha(id)
      toast({ title: '✅ Campanha fechada e arquivada', className: 'bg-emerald-600 text-white' })
      loadCampanhas()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const handleCardClick = (c: Campanha) => {
    setSelectedCampanha(c)
    setDetailsOpen(true)
  }

  const filtered = campanhas.filter((c) => {
    if (filterTipo !== 'todos' && c.tipo_imovel !== filterTipo) return false
    if (filterStatus !== 'todos' && c.status !== filterStatus) return false
    return true
  })

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#2E5F8A]/20 pb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-[#2E5F8A]" />
            Campanhas de Captação
          </h1>
          <p className="text-[14px] text-[#999999] font-bold mt-1 uppercase tracking-wider">
            {campanhas.filter((c) => c.status === 'ativa').length} campanhas ativas
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowHistory((v) => !v)}
            className="min-h-[48px] font-bold"
          >
            <History className="w-5 h-5 mr-2" />
            {showHistory ? 'Voltar' : 'Histórico'}
          </Button>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#4CAF50] hover:bg-[#388E3C] text-white min-h-[48px] px-6 font-bold shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {showHistory ? (
        <CampanhaHistoricoDashboard />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-[#666666] font-bold text-sm">
              <Filter className="w-4 h-4" /> Filtrar:
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipologia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Tipologias</SelectItem>
                <SelectItem value="apartamento">Apartamento</SelectItem>
                <SelectItem value="casa">Casa</SelectItem>
                <SelectItem value="galpao">Galpão</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="pausada">Pausadas</SelectItem>
                <SelectItem value="fechada">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-[#1A3A52]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-[#999999] font-medium bg-white rounded-xl border border-[#E5E5E5]">
              Nenhuma campanha encontrada. Crie a primeira campanha!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <CampanhaCard
                  key={c.id}
                  campanha={c}
                  onToggle={handleToggle}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NewCampanhaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadCampanhas}
      />

      <CampanhaDetailsModal
        campanha={selectedCampanha}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedCampanha(null)
        }}
      />
    </div>
  )
}
