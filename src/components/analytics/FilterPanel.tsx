import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Calendar, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardFilters {
  period: 'today' | 'this_week' | 'this_month' | 'custom'
  periodRange?: { start: string; end: string }
  userIds: string[]
}

interface FilterPanelProps {
  onFiltersChange: (filters: DashboardFilters) => void
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

  const filteredUsers = users.filter((u) =>
    (u.nome || u.email || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const toggleAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([])
    } else {
      setSelectedUserIds(users.map((u) => u.id))
    }
  }

  return (
    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-8">
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

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Users className="w-4 h-4 text-primary" /> Colaboradores
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={toggleAll}>
              {selectedUserIds.length === users.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <ScrollArea className="h-[140px] rounded-md border border-gray-200 dark:border-gray-800 p-2 bg-gray-50/50 dark:bg-gray-900/50">
            {loading ? (
              <p className="text-sm text-muted-foreground p-3 text-center animate-pulse">
                Carregando...
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3 text-center">
                Nenhum usuário encontrado
              </p>
            ) : (
              <div className="space-y-2.5 p-1 pr-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2.5 group">
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedUserIds([...selectedUserIds, user.id])
                        else setSelectedUserIds(selectedUserIds.filter((id) => id !== user.id))
                      }}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor={`user-${user.id}`}
                      className="text-sm font-medium leading-none cursor-pointer text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
                    >
                      {user.nome || user.email}
                    </label>
                  </div>
                ))}
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
