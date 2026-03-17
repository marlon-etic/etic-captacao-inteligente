import { useState, useMemo, useTransition } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LoosePropertyCard } from './LoosePropertyCard'
import { ManualLinkModal } from './ManualLinkModal'
import { CapturedProperty } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function PropertiesToLinkView() {
  const { looseProperties, currentUser } = useAppStore()
  const [linkProperty, setLinkProperty] = useState<CapturedProperty | null>(null)

  const [filterType, setFilterType] = useState('Todos')
  const [filterPeriod, setFilterPeriod] = useState('Todos')
  const [filterBairro, setFilterBairro] = useState('')
  const [isPending, startTransition] = useTransition()

  const sortedProperties = useMemo(() => {
    let result = [...looseProperties].filter((p) => {
      if (p.status_reivindicacao && p.status_reivindicacao !== 'disponivel') return false

      if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') {
        // allow all
      } else if (currentUser?.role === 'captador') {
        if (p.captador_id !== currentUser?.id) return false
      } else if (p.propertyType === 'Aluguel') {
        if (
          !(
            currentUser?.role === 'sdr' ||
            (currentUser?.role === 'corretor' &&
              currentUser?.tipos_demanda_solicitados?.includes('locacao'))
          )
        ) {
          return false
        }
      } else if (p.propertyType === 'Venda') {
        if (currentUser?.role !== 'corretor' && currentUser?.role !== 'sdr') return false
      }

      if (filterType !== 'Todos' && p.propertyType !== filterType) return false
      if (filterBairro && !p.neighborhood?.toLowerCase().includes(filterBairro.toLowerCase()))
        return false

      const capDate = new Date(p.capturedAt || '')
      const diffDays = (new Date().getTime() - capDate.getTime()) / (1000 * 3600 * 24)
      if (filterPeriod === 'Últimos 7 dias' && diffDays > 7) return false
      if (filterPeriod === '30 dias' && diffDays > 30) return false

      return true
    })

    return result.sort(
      (a, b) => new Date(b.capturedAt || '').getTime() - new Date(a.capturedAt || '').getTime(),
    )
  }, [looseProperties, currentUser, filterType, filterPeriod, filterBairro])

  return (
    <div className="flex flex-col gap-[16px] animate-fade-in w-full">
      <div className="sticky top-[116px] md:top-[124px] z-10 bg-[#F5F5F5] pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-[16px] bg-[#FFFFFF] p-[16px] rounded-[12px] border border-[#E5E5E5] shadow-[0_4px_12px_rgba(26,58,82,0.05)]">
          <div className="flex items-center gap-[12px] overflow-x-auto scrollbar-hide shrink-0 w-full lg:w-auto">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">Tipo:</span>
            {['Todos', 'Venda', 'Aluguel'].map((p) => (
              <Badge
                key={p}
                onClick={() => startTransition(() => setFilterType(p))}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[32px] px-[12px] transition-colors duration-200',
                  filterType === p
                    ? 'bg-[#1A3A52] text-white border-transparent'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p}
              </Badge>
            ))}
          </div>

          <div className="hidden lg:block w-[1px] h-[32px] bg-[#E5E5E5] shrink-0" />

          <div className="flex items-center gap-[12px] overflow-x-auto scrollbar-hide shrink-0 w-full lg:w-auto">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">
              Período:
            </span>
            {['Todos', 'Últimos 7 dias', '30 dias'].map((p) => (
              <Badge
                key={p}
                onClick={() => startTransition(() => setFilterPeriod(p))}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[32px] px-[12px] transition-colors duration-200',
                  filterPeriod === p
                    ? 'bg-[#1A3A52] text-white border-transparent'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p}
              </Badge>
            ))}
          </div>

          <div className="hidden lg:block w-[1px] h-[32px] bg-[#E5E5E5] shrink-0" />

          <div className="flex items-center gap-[12px] w-full lg:w-auto flex-1">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] w-4 h-4" />
              <Input
                placeholder="Filtrar por bairro..."
                value={filterBairro}
                onChange={(e) => startTransition(() => setFilterBairro(e.target.value))}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              startTransition(() => {
                setFilterType('Todos')
                setFilterPeriod('Todos')
                setFilterBairro('')
              })
            }}
            className="text-[#1A3A52] font-bold text-[14px] w-full lg:w-auto shrink-0 border border-transparent hover:bg-[#F5F5F5]"
          >
            <RefreshCw className="w-[16px] h-[16px] mr-[8px]" /> Limpar
          </Button>
        </div>
      </div>

      <div className={cn('transition-opacity duration-200 w-full pt-2', isPending && 'opacity-50')}>
        {sortedProperties.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5] w-full">
            <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
            <p className="text-[16px] font-bold text-[#333333]">Nenhum imóvel encontrado.</p>
            <p className="text-[14px] text-[#999999] mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        ) : (
          <div className="grid gap-[16px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sortedProperties.map((property, index) => (
              <div
                key={property.code}
                className="opacity-0 animate-cascade-fade"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <LoosePropertyCard property={property} onLink={setLinkProperty} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ManualLinkModal
        isOpen={!!linkProperty}
        property={linkProperty}
        onClose={() => setLinkProperty(null)}
      />
    </div>
  )
}
