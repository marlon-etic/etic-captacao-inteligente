import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'

export type PeriodType = 'today' | 'this_week' | 'this_month' | 'custom'

export interface AnalyticsFilters {
  period: PeriodType
  periodRange?: { start: string; end: string }
  userIds: string[]
}

interface FilterPanelProps {
  onFiltersChange: (filters: AnalyticsFilters) => void
}

interface User {
  id: string
  email: string
  nome?: string
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const { toast } = useToast()
  const [period, setPeriod] = useState<PeriodType>('this_week')
  const [periodRange, setPeriodRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome')
        .in('role', ['captador', 'sdr', 'corretor'])
        .order('email')

      if (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar usuários.',
          variant: 'destructive',
        })
        throw error
      }
      setUsers(data || [])
    } catch (err) {
      console.error('[FilterPanel] Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'Filtro inválido',
        description: 'Selecione pelo menos um usuário',
        variant: 'destructive',
      })
      return
    }

    if (period === 'custom') {
      if (!periodRange.start || !periodRange.end) {
        toast({
          title: 'Filtro inválido',
          description: 'Preencha as datas de início e fim',
          variant: 'destructive',
        })
        return
      }
      if (new Date(periodRange.start) > new Date(periodRange.end)) {
        toast({
          title: 'Filtro inválido',
          description: 'Data de início não pode ser maior que data de fim',
          variant: 'destructive',
        })
        return
      }
      const today = new Date().toISOString().split('T')[0]
      if (periodRange.start > today || periodRange.end > today) {
        toast({
          title: 'Filtro inválido',
          description: 'Não é possível selecionar datas futuras',
          variant: 'destructive',
        })
        return
      }
    }

    let filterCount = 1
    if (selectedUserIds.length > 0 && selectedUserIds.length < users.length) {
      filterCount++
    }
    setActiveFilters(filterCount)

    onFiltersChange({
      period,
      periodRange: period === 'custom' ? periodRange : undefined,
      userIds: selectedUserIds,
    })
  }

  const handleClearFilters = () => {
    setPeriod('this_week')
    setSelectedUserIds([])
    setSearchQuery('')
    setActiveFilters(0)
    onFiltersChange({
      period: 'this_week',
      userIds: [],
    })
  }

  const filteredUsers = users.filter(
    (u) =>
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.nome || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleAllUsers = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(filteredUsers.map((u) => u.id))
    } else {
      setSelectedUserIds([])
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[#1A3A52]">Filtros de Análise</h2>
        {activeFilters > 0 && (
          <span className="bg-blue-100 text-[#1A3A52] text-xs font-bold px-2.5 py-1 rounded">
            {activeFilters} Filtro(s) Ativo(s)
          </span>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Período</label>
        <div className="flex gap-2 flex-wrap">
          {(['today', 'this_week', 'this_month', 'custom'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                period === p
                  ? 'bg-[#1A3A52] text-white border-[#1A3A52]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {p === 'today' && 'Hoje'}
              {p === 'this_week' && 'Esta Semana'}
              {p === 'this_month' && 'Este Mês'}
              {p === 'custom' && 'Personalizado'}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="mt-4 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-md border border-gray-100 animate-in fade-in slide-in-from-top-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
              <input
                type="date"
                value={periodRange.start}
                onChange={(e) => setPeriodRange({ ...periodRange, start: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A52]/20 focus:border-[#1A3A52]"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
              <input
                type="date"
                value={periodRange.end}
                onChange={(e) => setPeriodRange({ ...periodRange, end: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A52]/20 focus:border-[#1A3A52]"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">Usuários</label>
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-[#1A3A52] focus:ring-[#1A3A52]"
              onChange={(e) => toggleAllUsers(e.target.checked)}
              checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
            />
            Selecionar Todos
          </label>
        </div>

        <input
          type="text"
          placeholder="Buscar por email ou nome..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#1A3A52]/20 focus:border-[#1A3A52]"
        />

        {loading ? (
          <div className="p-4 text-center border border-gray-200 rounded-md bg-gray-50">
            <div className="inline-block w-5 h-5 border-2 border-[#1A3A52] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 text-sm">Carregando usuários...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-4 text-center border border-gray-200 rounded-md bg-gray-50">
            <p className="text-gray-500 text-sm">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto bg-white divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUserIds([...selectedUserIds, user.id])
                    } else {
                      setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A3A52] focus:ring-[#1A3A52]"
                />
                <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                  {user.nome || 'Sem Nome'}{' '}
                  <span className="text-gray-400 font-normal">({user.email})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleApplyFilters}
          className="px-6 py-2.5 bg-[#1A3A52] text-white rounded-md font-medium hover:bg-[#153045] transition-colors flex items-center justify-center min-w-[140px] shadow-sm"
        >
          Aplicar Filtros
        </button>
        <button
          onClick={handleClearFilters}
          className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          Limpar
        </button>
      </div>
    </div>
  )
}
