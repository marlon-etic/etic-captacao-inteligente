import { useMemo, useState } from 'react'
import { useSupabaseDemands } from '@/hooks/use-supabase-demands'
import { ArchiveX, RefreshCw, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { SyncIndicator } from '@/components/SyncIndicator'
import { cn } from '@/lib/utils'

export default function PerdidosPage() {
  const { demands: locacoes, loading: loadingL, syncing: syncL } = useSupabaseDemands('Aluguel')
  const { demands: vendas, loading: loadingV, syncing: syncV } = useSupabaseDemands('Venda')
  const [isReopening, setIsReopening] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(20)

  const loading = loadingL || loadingV
  const syncing = syncL || syncV

  const lostDemands = useMemo(() => {
    return [...locacoes, ...vendas]
      .filter((d) => d.status_demanda === 'impossivel')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [locacoes, vendas])

  const visibleDemands = lostDemands.slice(0, visibleCount)

  const handleReabrir = async (id: string, type: 'Aluguel' | 'Venda') => {
    if (isReopening) return
    setIsReopening(id)
    try {
      const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
      const { error } = await supabase.from(table).update({ status_demanda: 'aberta' }).eq('id', id)

      if (error) throw error

      toast({
        title: '✅ Demanda Reaberta!',
        description: 'A demanda retornou para a lista de "Demandas Abertas".',
        className: 'bg-[#10B981] text-white border-none',
        duration: 3000,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao reabrir demanda',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsReopening(null)
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-[16px] md:gap-[24px] w-full max-w-[1400px] mx-auto pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] md:gap-[24px]">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[220px] w-full rounded-[12px] animate-fast-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] w-full max-w-[1400px] mx-auto animate-fade-in-up pb-8 relative">
      {lostDemands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#FFFFFF] border-[2px] rounded-[16px] border-dashed border-[#E5E5E5] shadow-sm mt-4 min-h-[300px]">
          <ArchiveX className="w-16 h-16 text-[#999999]/30 mb-4" />
          <h3 className="text-[20px] font-black text-[#1A3A52] text-center">
            Nenhuma demanda perdida.
          </h3>
          <p className="text-[14px] text-[#666666] mt-2 text-center max-w-[360px] font-medium leading-relaxed">
            As demandas marcadas como "Fora do mercado" pelos captadores aparecerão aqui com
            sincronização em tempo real.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] md:gap-[24px]">
            {visibleDemands.map((demand, index) => {
              const isAluguel = demand.tipo === 'Aluguel'
              const reason =
                demand.respostas_captador?.find((r) => r.resposta === 'nao_encontrei')?.motivo ||
                'Motivo não especificado'
              const obs =
                demand.respostas_captador?.find((r) => r.resposta === 'nao_encontrei')
                  ?.observacao || ''

              return (
                <div
                  key={demand.id}
                  className="bg-white border-[2px] border-[#E5E5E5] rounded-[16px] p-5 flex flex-col gap-4 shadow-[0_2px_8px_rgba(26,58,82,0.05)] hover:border-[#EF4444]/40 hover:shadow-md transition-all duration-200 opacity-95 hover:opacity-100 animate-cascade-fade"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex flex-col pr-2">
                      <span className="text-[11px] font-black text-[#999999] uppercase tracking-widest">
                        {isAluguel ? 'Aluguel' : 'Venda'}
                      </span>
                      <h3
                        className="text-[18px] font-black text-[#1A3A52] leading-tight mt-1 line-clamp-2"
                        title={demand.nome_cliente}
                      >
                        {demand.nome_cliente}
                      </h3>
                    </div>
                    <div className="bg-[#F3F4F6] text-[#6B7280] text-[10px] font-black px-2.5 py-1 rounded-md shadow-sm uppercase tracking-widest shrink-0 border border-[#E5E5E5]">
                      PERDIDA
                    </div>
                  </div>

                  <div className="text-[13px] text-[#666666] flex flex-col gap-2 mt-1 bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E5E5E5]">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                      <span className="font-medium line-clamp-1">
                        {demand.bairros?.join(', ') || 'Sem localização'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-[#333333]">💰 Orçamento:</strong>
                      <span className="text-[#10B981] font-bold">
                        Até R$ {formatPrice(demand.valor_maximo)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5E5] mt-1 flex flex-col gap-1">
                      <div>
                        <strong className="text-[#333333]">Motivo:</strong>{' '}
                        <span className="text-[#EF4444] font-bold">{reason}</span>
                      </div>
                      {obs && (
                        <div className="text-[12px] italic text-[#666666] line-clamp-2" title={obs}>
                          "{obs}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[#E5E5E5] flex justify-end shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => handleReabrir(demand.id, demand.tipo)}
                      disabled={isReopening === demand.id}
                      className={cn(
                        'w-full sm:w-auto font-black text-[#10B981] border-[#10B981]/30 bg-white hover:bg-[#ECFDF5] hover:border-[#10B981] transition-all min-h-[44px]',
                        isReopening === demand.id && 'opacity-70',
                      )}
                    >
                      {isReopening === demand.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Reabrindo...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" /> Reabrir Demanda
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {lostDemands.length > visibleCount && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((v) => v + 20)}
                className="font-bold border-[#2E5F8A] text-[#1A3A52] min-w-[200px] min-h-[48px] hover:bg-[#F5F5F5]"
              >
                Carregar mais resultados
              </Button>
            </div>
          )}
        </>
      )}

      <SyncIndicator isSyncing={syncing} />
    </div>
  )
}
