import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useSdrStore } from '@/hooks/use-sdr-store'

export function useSdrQueries() {
  const { user } = useAuth()
  const { periodo, dataCustomStart, dataCustomEnd } = useSdrStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const role = user?.user_metadata?.role || user?.app_metadata?.role || 'sdr'
    const isLocacao = role === 'sdr'
    const tipoTransacao = isLocacao ? 'Locação' : 'Venda'

    async function fetchData() {
      setLoading(true)
      try {
        let start = new Date()
        let end = new Date()
        if (periodo === 'hoje') {
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'semana') {
          const day = start.getDay()
          const diff = start.getDate() - day + (day === 0 ? -6 : 1)
          start = new Date(start.setDate(diff))
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'mes') {
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'custom' && dataCustomStart) {
          start = new Date(dataCustomStart)
          if (dataCustomEnd) end = new Date(dataCustomEnd)
        }

        const startIso = start.toISOString()
        const endIso = end.toISOString()

        const demandasTable = isLocacao ? 'demandas_locacao' : 'demandas_vendas'
        const ownerField = isLocacao ? 'sdr_id' : 'corretor_id'

        const { data: demandas } = await supabase
          .from(demandasTable)
          .select('*')
          .eq(ownerField, user.id)
          .gte('created_at', startIso)
          .lte('created_at', endIso)

        const { data: imoveisLivres } = await supabase
          .from('imoveis_captados')
          .select('*')
          .eq('tipo', tipoTransacao)
          .is('demanda_locacao_id', null)
          .is('demanda_venda_id', null)
          .order('created_at', { ascending: false })
          .limit(200)

        const sdrDemandaIds = demandas?.map((d: any) => d.id) || []
        const demandaIdField = isLocacao ? 'demanda_locacao_id' : 'demanda_venda_id'

        let imoveisSobDemanda = []
        if (sdrDemandaIds.length > 0) {
          const { data: isd } = await supabase
            .from('imoveis_captados')
            .select('*, imovel_demand_match(*)')
            .in(demandaIdField, sdrDemandaIds)
            .order('created_at', { ascending: false })
          imoveisSobDemanda = isd || []
        }

        const { data: visitas } = await supabase
          .from('visitas_imovel')
          .select('*')
          .eq('user_sdr_id', user.id)
          .eq('tipo_demanda', tipoTransacao)
          .gte('created_at', startIso)

        const { data: fechados } = await supabase
          .from('fechamentos')
          .select('*')
          .eq('user_sdr_id', user.id)
          .eq('tipo_demanda', tipoTransacao)
          .gte('created_at', startIso)

        setData({
          demandas: demandas || [],
          imoveisLivres: imoveisLivres || [],
          imoveisSobDemanda,
          visitas: visitas || [],
          fechados: fechados || [],
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, periodo, dataCustomStart, dataCustomEnd])

  return { data, loading }
}
