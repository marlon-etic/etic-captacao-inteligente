import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Calendar, Users, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardFilters {
  period: 'today' | 'this_week' | 'this_month' | 'custom'
  periodRange?: { start: string; end: string }
  userIds: string[]
}

interface FilterPanelProps {
  onFiltersChange: (filters: DashboardFilters) => void
}

const getAvatarColor = (id: string) => {
  const colors = [
    'bg-red-500',
    'bg-pink-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-blue-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-orange-500',
  ]
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

const getInitials = (name: string, email: string) => {
  const source = name || email || ''
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.substring(0, 2).toUpperCase()
}

export function FilterPanel({ onFiltersChange }: FilterPanelProps) {
  const [period, setPeriod] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_week')
  const [periodRange, setPeriodRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const [users, setUsers] = useState<{ id: string; email: string; nome: string }[]>([])
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
        .order('nome')

      if (error) throw error

      const loadedUsers = data || []
      setUsers(loadedUsers)

      const allIds = loadedUsers.map((u) => u.id)
      setSelectedUserIds(allIds)
      onFiltersChange({
        period: 'this_week',
        userIds: allIds,
      })
    } catch (err) {
      console.error('[FilterPanel] Erro ao carregar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    if (selectedUserIds.length === 0) {
      alert('Selecione pelo menos um usuário')
      return
    }

    if (period === 'custom') {
      if (!periodRange.start || !periodRange.end) {
        alert('Preencha as datas de início e fim')
        return
      }
      if (new Date(periodRange.start) > new Date(periodRange.end)) {
        alert('Data de início não pode ser maior que a data de fim')
        return
      }
    }

    let filterCount = 1
    if (selectedUserIds.length < users.length) filterCount++
    setActiveFilters(filterCount)

    onFiltersChange({
      period,
      periodRange: period === 'custom' ? periodRange : undefined,
      userIds: selectedUserIds,
    })
  }

  const handleClearFilters = () => {
    setPeriod('this_week')
    const allIds = users.map((u) => u.id)
    setSelectedUserIds(allIds)
    setSearchQuery('')
    setActiveFilters(0)

    onFiltersChange({
      period: 'this_week',
      userIds: allIds,
    })
  }

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return users
    return users.filter((u) => (u.nome || u.email || '').toLowerCase().includes(query))
  }, [users, searchQuery])

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Calendar className="w-4 h-4 text-primary" /> Período de Análise
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'this_week', label: 'Esta Semana' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'custom', label: 'Personalizado' },
            ].map((p) => (
              <Button
                key={p.id}
                variant={period === p.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.id as any)}
                className={cn('rounded-full transition-all', period === p.id && 'shadow-sm')}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in-down">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Data Início</Label>
                <Input
                  type="date"
                  value={periodRange.start}
                  onChange={(e) => setPeriodRange({ ...periodRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Data Fim</Label>
                <Input
                  type="date"
                  value={periodRange.end}
                  onChange={(e) => setPeriodRange({ ...periodRange, end: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-[2] flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Users className="w-4 h-4 text-primary" /> Colaboradores
              <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {selectedUserIds.length} de {users.length} selecionados
              </span>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedUserIds(users.map((u) => u.id))}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>

          {selectedUserIds.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 max-h-[120px] overflow-y-auto">
              {users
                .filter((u) => selectedUserIds.includes(u.id))
                .map((user) => {
                  const name = user.nome || user.email.split('@')[0]
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-1.5 bg-white dark:bg-slate-950 px-2.5 py-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200"
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                          getAvatarColor(user.id),
                        )}
                      >
                        {getInitials(user.nome, user.email)}
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
                        }
                        className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 rounded-full p-0.5 focus:outline-none transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
            />
          </div>

          <ScrollArea className="h-[260px] rounded-lg border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-900/20">
            {loading ? (
              <p className="text-sm text-muted-foreground p-3 text-center animate-pulse">
                Carregando...
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 text-center">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 p-1 pr-3">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id)
                  const name = user.nome || user.email.split('@')[0]

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
                        } else {
                          setSelectedUserIds([...selectedUserIds, user.id])
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left group relative overflow-hidden',
                        isSelected
                          ? 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-sm'
                          : 'border-transparent bg-white dark:bg-slate-950 hover:border-slate-200 dark:hover:border-slate-800 shadow-sm hover:shadow',
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 transition-transform group-hover:scale-105',
                          getAvatarColor(user.id),
                        )}
                      >
                        {getInitials(user.nome, user.email)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate transition-colors',
                            isSelected
                              ? 'text-primary'
                              : 'text-slate-900 dark:text-slate-100 group-hover:text-primary',
                          )}
                        >
                          {name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-200">
                          <svg
                            className="w-3 h-3 text-primary-foreground"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Restaurar Padrão
        </Button>
        <Button size="sm" onClick={handleApplyFilters} className="min-w-[140px] shadow-sm">
          Aplicar Filtros
          {activeFilters > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-white/20 hover:bg-white/30 text-white border-0 font-bold px-1.5 py-0"
            >
              {activeFilters}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  )
}
