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
    const demandasTable = isLocacao ? 'demandas_locacao' : 'demandas_vendas'
    const ownerField = isLocacao ? 'sdr_id' : 'corretor_id'

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

        const { data: demandas } = await supabase
          .from(demandasTable)
          .select('*, imovel_demand_match(*)')
          .eq(ownerField, user.id)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false })

        const seteDiasAtras = new Date()
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
        const { data: demandasInativas } = await supabase
          .from(demandasTable)
          .select('*')
          .eq(ownerField, user.id)
          .in('status_demanda', ['aberta', 'em busca', 'em visita'])
          .not('updated_at', 'is', null)
          .lt('updated_at', seteDiasAtras.toISOString())

        const { data: imoveisLivres } = await supabase
          .from('imoveis_captados')
          .select('*, imovel_demand_match(*)')
          .eq('tipo', tipoTransacao)
          .is('demanda_locacao_id', null)
          .is('demanda_venda_id', null)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false })
          .limit(200)

        const imoveisLivresFiltered =
          imoveisLivres?.filter(
            (i) => !i.imovel_demand_match || i.imovel_demand_match.length === 0,
          ) || []

        const sdrDemandaIds = demandas?.map((d: any) => d.id) || []
        let imoveisSobDemanda = []
        if (sdrDemandaIds.length > 0) {
          const { data: imV } = await supabase
            .from('imovel_demand_match')
            .select('*, imoveis_captados(*)')
            .in('demanda_id', sdrDemandaIds)
          imoveisSobDemanda = imV?.map((m: any) => ({ ...m.imoveis_captados, match_info: m })) || []
        }

        const { data: visitas } = await supabase
          .from('visitas_imovel')
          .select('*')
          .eq('user_sdr_id', user.id)
          .eq('tipo_demanda', tipoTransacao)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('data_visita', { ascending: false })

        const { data: fechados } = await supabase
          .from('fechamentos')
          .select('*')
          .eq('user_sdr_id', user.id)
          .eq('tipo_demanda', tipoTransacao)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false })

        setData({
          demandas: demandas || [],
          demandasInativas: demandasInativas || [],
          imoveisLivres: imoveisLivresFiltered,
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
