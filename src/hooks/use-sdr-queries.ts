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
        let applyDateFilter = true

        if (periodo === 'hoje') {
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'semana') {
          start.setDate(start.getDate() - 7)
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'mes') {
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
        } else if (periodo === 'sempre') {
          applyDateFilter = false
        } else if (periodo === 'custom' && dataCustomStart) {
          start = new Date(dataCustomStart)
          if (dataCustomEnd) end = new Date(dataCustomEnd)
        }

        const startIso = start.toISOString()
        const endIso = end.toISOString()

        const customField = isLocacao ? 'observacoes' : 'necessidades_especificas'
        const fieldsToSelect = `id, created_at, status_demanda, updated_at, nome_cliente, cliente_nome, valor_maximo, bairros, ${ownerField}, is_prioritaria, nivel_urgencia, ${customField}`

        let demandasQuery = supabase
          .from(demandasTable)
          .select(fieldsToSelect)
          .neq('status_demanda', 'impossivel')
          .eq(ownerField, user.id)
          .order('updated_at', { ascending: false, nullsFirst: false })

        if (applyDateFilter) {
          demandasQuery = demandasQuery.gte('created_at', startIso).lte('created_at', endIso)
        }

        const seteDiasAtras = new Date()
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
        let demandasInativasQuery = supabase
          .from(demandasTable)
          .select(fieldsToSelect)
          .in('status_demanda', ['aberta', 'em busca', 'em visita'])
          .eq(ownerField, user.id)
          .not('updated_at', 'is', null)
          .lt('updated_at', seteDiasAtras.toISOString())

        const { data: demandas } = await demandasQuery
        const { data: demandasInativas } = await demandasInativasQuery

        let imoveisLivresQuery = supabase
          .from('imoveis_captados')
          .select(
            'id, codigo_imovel, endereco, preco, valor, created_at, updated_at, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, imovel_demand_match(id, demanda_id, tipo_vinculacao)',
          )
          .eq('tipo', tipoTransacao)
          .is('demanda_locacao_id', null)
          .is('demanda_venda_id', null)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .limit(200)

        if (applyDateFilter) {
          imoveisLivresQuery = imoveisLivresQuery
            .gte('created_at', startIso)
            .lte('created_at', endIso)
        }
        const { data: imoveisLivres } = await imoveisLivresQuery

        const imoveisLivresFiltered =
          imoveisLivres?.filter(
            (i) => !i.imovel_demand_match || i.imovel_demand_match.length === 0,
          ) || []

        const sdrDemandaIds = demandas?.map((d: any) => d.id) || []
        let imoveisSobDemanda: any[] = []
        if (sdrDemandaIds.length > 0) {
          const { data: imV } = await supabase
            .from('imovel_demand_match')
            .select(
              'id, demanda_id, tipo_vinculacao, compatibilidade_pct, imovel_id, imoveis_captados(id, codigo_imovel, endereco, preco, valor, created_at, updated_at, user_captador_id, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, users!imoveis_captados_user_captador_id_fkey(nome))',
            )
            .in('demanda_id', sdrDemandaIds)

          imoveisSobDemanda = (
            imV?.map((m: any) => ({ ...m.imoveis_captados, match_info: m })) || []
          ).sort(
            (a: any, b: any) =>
              new Date(b.updated_at || b.created_at).getTime() -
              new Date(a.updated_at || a.created_at).getTime(),
          )

          if (demandas && imV) {
            for (const d of demandas) {
              d.imovel_demand_match = imV.filter((m: any) => m.demanda_id === d.id)
            }
          }
        } else if (demandas) {
          for (const d of demandas) {
            d.imovel_demand_match = []
          }
        }

        let visitasQuery = supabase
          .from('visitas_imovel')
          .select(
            'id, demanda_id, imovel_id, novo_imovel_endereco, novo_imovel_valor, user_sdr_id, data_visita, created_at',
          )
          .eq('tipo_demanda', tipoTransacao)
          .eq('user_sdr_id', user.id)
          .order('data_visita', { ascending: false })

        let fechadosQuery = supabase
          .from('fechamentos')
          .select(
            'id, demanda_id, imovel_id, user_sdr_id, valor, data_prevista, status, created_at',
          )
          .eq('tipo_demanda', tipoTransacao)
          .eq('user_sdr_id', user.id)
          .order('created_at', { ascending: false })

        if (applyDateFilter) {
          visitasQuery = visitasQuery.gte('created_at', startIso).lte('created_at', endIso)
          fechadosQuery = fechadosQuery.gte('created_at', startIso).lte('created_at', endIso)
        }

        const { data: visitas } = await visitasQuery
        const { data: fechados } = await fechadosQuery

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

    const channel = supabase
      .channel('sdr_queries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: demandasTable }, fetchData)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imovel_demand_match' },
        fetchData,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        fetchData,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, periodo, dataCustomStart, dataCustomEnd])

  return { data, loading }
}
