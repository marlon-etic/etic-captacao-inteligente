import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Target, Building2, Home } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FocoCaptacaoDetailsModal } from '@/components/dashboard/FocoCaptacaoDetailsModal'

interface FocoItem {
  tipo: string
  tipo_imovel: string
  bairro_alvo: string | null
  qtd_clientes_aguardando: number | null
  ticket_medio: number | null
}

export function DashboardFoco() {
  const [focoData, setFocoData] = useState<FocoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFoco, setSelectedFoco] = useState<FocoItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchFoco = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('vw_foco_captacao_v6').select('*').limit(6)
      if (data && !error) setFocoData(data as FocoItem[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFoco()
  }, [fetchFoco])

  if (loading) {
    return (
      <div className="mb-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#2E5F8A]" />
          <h2 className="text-xl font-black text-[#1A3A52]">Prioridades de Captação</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[90px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (focoData.length === 0) return null

  const handleCardClick = (item: FocoItem) => {
    setSelectedFoco(item)
    setModalOpen(true)
  }

  return (
    <>
      <div className="mb-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-[#2E5F8A]" />
          <h2 className="text-xl font-black text-[#1A3A52]">Prioridades de Captação</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {focoData.map((item, idx) => (
            <Card
              key={idx}
              className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#2E5F8A]/30"
              onClick={() => handleCardClick(item)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                  {item.tipo_imovel === 'Comercial' ? (
                    <Building2 className="w-6 h-6" />
                  ) : (
                    <Home className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#1A3A52] line-clamp-1">
                    {item.bairro_alvo || 'Região Indefinida'}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-emerald-600 font-medium">
                      {item.qtd_clientes_aguardando} clientes
                    </span>
                    <span className="text-gray-400 font-medium text-xs">
                      Ticket:{' '}
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(item.ticket_medio || 0)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.tipo} • {item.tipo_imovel}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <FocoCaptacaoDetailsModal
        focoItem={selectedFoco}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedFoco(null)
        }}
      />
    </>
  )
}
