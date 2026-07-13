import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useSdrStore } from '@/hooks/use-sdr-store'

export function useSdrQueries() {
  const { user } = useAuth()
  const { periodo, dataCustomStart, dataCustomEnd } = useSdrStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)

  useEffect(() => {
    if (!user) return
    const role = user?.user_metadata?.role || user?.app_metadata?.role || 'sdr'
    const isAdmin = role === 'admin' || role === 'gestor'
    const isCaptador = role === 'captador'
    const isCorretor = role === 'corretor' || role === 'broker'
    const isSdr = role === 'sdr'

    async function fetchData() {
      if (isFetchingRef.current) return
      isFetchingRef.current = true
      lastFetchTimeRef.current = Date.now()
      setLoading(true)
      try {
        let start = new Date()
        let end = new Date()
        let applyDateFilter = true

        if (periodo === 'hoje') {
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        } else if (periodo === 'semana') {
          start.setDate(start.getDate() - 7)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        } else if (periodo === 'mes') {
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
        } else if (periodo === 'sempre') {
          applyDateFilter = false
        } else if (periodo === 'custom' && dataCustomStart) {
          start = new Date(dataCustomStart)
          start.setHours(0, 0, 0, 0)
          if (dataCustomEnd) {
            end = new Date(dataCustomEnd)
            end.setHours(23, 59, 59, 999)
          } else {
            end.setHours(23, 59, 59, 999)
          }
        }

        const startIso = start.toISOString()
        const endIso = end.toISOString()

        const seteDiasAtras = new Date()
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
        const seteDiasAtrasIso = seteDiasAtras.toISOString()

        const fetchDemandas = async (
          tabela: string,
          ownerField: string,
          tipoDemanda: string,
          customField: string,
          visibility: 'all' | 'own',
        ) => {
          const fields = `id, created_at, status_demanda, updated_at, nome_cliente, cliente_nome, valor_minimo, valor_maximo, bairros, ${ownerField}, is_prioritaria, nivel_urgencia, telefone, email, dormitorios, vagas_estacionamento, banheiros, tipo_imovel, ${customField}`

          let queryCreated = supabase
            .from(tabela)
            .select(fields)
            .neq('status_demanda', 'impossivel')
          if (visibility === 'own') queryCreated = queryCreated.eq(ownerField, user.id)
          if (applyDateFilter)
            queryCreated = queryCreated.gte('created_at', startIso).lte('created_at', endIso)
          queryCreated = queryCreated.order('updated_at', { ascending: false, nullsFirst: false })

          let queryActive = supabase
            .from(tabela)
            .select(fields)
            .in('status_demanda', ['aberta', 'em busca', 'em visita'])
          if (visibility === 'own') queryActive = queryActive.eq(ownerField, user.id)

          let inativasQuery = supabase
            .from(tabela)
            .select(fields)
            .in('status_demanda', ['aberta', 'em busca', 'em visita'])
            .not('updated_at', 'is', null)
            .lt('updated_at', seteDiasAtrasIso)
          if (visibility === 'own') inativasQuery = inativasQuery.eq(ownerField, user.id)

          const [{ data: dCreated }, { data: dActive }, { data: inativas }] = await Promise.all([
            queryCreated,
            queryActive,
            inativasQuery,
          ])

          const combinedMap = new Map()
          ;[...(dCreated || []), ...(dActive || [])].forEach((item: any) => {
            combinedMap.set(item.id, item)
          })
          const combinedDemandas = Array.from(combinedMap.values()).sort(
            (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )

          return {
            demandas: combinedDemandas.map((x: any) => ({
              ...x,
              tipo: tipoDemanda,
              tipo_demanda: tipoDemanda,
              dormitorios: Number(x.dormitorios) || 0,
              vagas_estacionamento: Number(x.vagas_estacionamento) || 0,
              banheiros: Number(x.banheiros) || 0,
              valor_minimo: Number(x.valor_minimo) || 0,
              valor_maximo: Number(x.valor_maximo) || 0,
            })),
            inativas: (inativas || []).map((x: any) => ({
              ...x,
              tipo: tipoDemanda,
              tipo_demanda: tipoDemanda,
              dormitorios: Number(x.dormitorios) || 0,
              vagas_estacionamento: Number(x.vagas_estacionamento) || 0,
              banheiros: Number(x.banheiros) || 0,
              valor_minimo: Number(x.valor_minimo) || 0,
              valor_maximo: Number(x.valor_maximo) || 0,
            })),
          }
        }

        const visLocacao = isAdmin || isCaptador || isSdr ? 'all' : 'own'
        const visVendas = isAdmin || isCaptador || isCorretor ? 'all' : 'own'

        const fetchActivities = async (tabela: string, dataField: string) => {
          let q = supabase.from(tabela).select('*')
          if (!isAdmin) q = q.eq('user_sdr_id', user.id)
          if (applyDateFilter) q = q.gte('created_at', startIso).lte('created_at', endIso)
          q = q.order(dataField, { ascending: false })
          const { data } = await q
          return data || []
        }

        const buildImoveisQuery = () => {
          let q = supabase
            .from('imoveis_captados')
            .select(
              'id, codigo_imovel, endereco, preco, valor, created_at, updated_at, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, user_captador_id, demanda_locacao_id, demanda_venda_id, imovel_demand_match(id, demanda_id, tipo_vinculacao)',
            )
            .not('status_captacao', 'in', '("perdido","removido")')

          if (!isAdmin) {
            if (isCaptador) q = q.eq('user_captador_id', user.id)
            else if (isSdr) q = q.in('tipo', ['Locação', 'Ambos'])
            else if (isCorretor) q = q.in('tipo', ['Venda', 'Ambos'])
          }
          return q
        }

        let qCreated = buildImoveisQuery()
        if (applyDateFilter)
          qCreated = qCreated.gte('created_at', startIso).lte('created_at', endIso)
        qCreated = qCreated.order('updated_at', { ascending: false, nullsFirst: false }).limit(500)

        let qActive = buildImoveisQuery()
          .in('status_captacao', ['ativo', 'em captacao', 'em_captacao', 'Ativo'])
          .limit(1000)

        const [
          resLocacao,
          resVendas,
          { data: imCreated },
          { data: imActive },
          visitasResult,
          fechadosResult,
        ] = await Promise.all([
          fetchDemandas('demandas_locacao', 'sdr_id', 'Locação', 'observacoes', visLocacao),
          fetchDemandas(
            'demandas_vendas',
            'corretor_id',
            'Venda',
            'necessidades_especificas',
            visVendas,
          ),
          qCreated,
          qActive,
          !isCaptador ? fetchActivities('visitas_imovel', 'data_visita') : Promise.resolve([]),
          !isCaptador ? fetchActivities('fechamentos', 'created_at') : Promise.resolve([]),
        ])

        let todasDemandas = [...resLocacao.demandas, ...resVendas.demandas]
        let demandasInativas = [...resLocacao.inativas, ...resVendas.inativas]

        const imCombinedMap = new Map()
        ;[...(imCreated || []), ...(imActive || [])].forEach((item: any) => {
          imCombinedMap.set(item.id, {
            ...item,
            dormitorios: Number(item.dormitorios) || 0,
            vagas: Number(item.vagas) || 0,
            banheiros: Number(item.banheiros) || 0,
            preco: Number(item.preco) || 0,
            valor: Number(item.valor) || 0,
          })
        })

        const todosImoveis = Array.from(imCombinedMap.values())

        const imoveisLivresFiltered = todosImoveis
          .filter(
            (i: any) =>
              (!i.imovel_demand_match || i.imovel_demand_match.length === 0) &&
              !i.demanda_locacao_id &&
              !i.demanda_venda_id,
          )
          .sort(
            (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )

        const sdrDemandaIds = todasDemandas.map((d: any) => d.id) || []
        let imoveisSobDemanda: any[] = []
        let imVList: any[] = []

        if (sdrDemandaIds.length > 0) {
          const chunkSize = 150
          const chunkPromises = []

          for (let i = 0; i < sdrDemandaIds.length; i += chunkSize) {
            const chunk = sdrDemandaIds.slice(i, i + chunkSize)
            chunkPromises.push(
              supabase
                .from('imovel_demand_match')
                .select(
                  'id, demanda_id, tipo_vinculacao, compatibilidade_pct, imovel_id, imoveis_captados(id, codigo_imovel, endereco, preco, valor, created_at, updated_at, user_captador_id, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, users!imoveis_captados_user_captador_id_fkey(nome))',
                )
                .in('demanda_id', chunk)
                .gt('compatibilidade_pct', 50),
            )
          }
          const chunkResults = await Promise.all(chunkPromises)
          chunkResults.forEach(({ data }) => {
            if (data) imVList.push(...data)
          })

          imoveisSobDemanda =
            imVList.map((m: any) => ({
              ...m.imoveis_captados,
              match_info: m,
              dormitorios: Number(m.imoveis_captados?.dormitorios) || 0,
              vagas: Number(m.imoveis_captados?.vagas) || 0,
              banheiros: Number(m.imoveis_captados?.banheiros) || 0,
              preco: Number(m.imoveis_captados?.preco) || 0,
              valor: Number(m.imoveis_captados?.valor) || 0,
            })) || []

          for (const d of todasDemandas) {
            d.imovel_demand_match = imVList.filter((m: any) => m.demanda_id === d.id)
          }
        } else {
          for (const d of todasDemandas) {
            d.imovel_demand_match = []
          }
        }

        const alreadyInSobDemanda = new Set(imoveisSobDemanda.map((i) => i.id))
        const directlyLinkedImoveis = todosImoveis.filter(
          (i: any) =>
            (i.demanda_locacao_id ||
              i.demanda_venda_id ||
              (i.imovel_demand_match && i.imovel_demand_match.length > 0)) &&
            !alreadyInSobDemanda.has(i.id),
        )

        imoveisSobDemanda = [...imoveisSobDemanda, ...directlyLinkedImoveis].sort(
          (a: any, b: any) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime(),
        )

        if (isCaptador && !isAdmin) {
          imoveisSobDemanda = imoveisSobDemanda.filter((i: any) => i.user_captador_id === user.id)
        }

        setData({
          demandas: todasDemandas,
          demandasInativas,
          imoveisLivres: imoveisLivresFiltered,
          imoveisSobDemanda,
          visitas: visitasResult,
          fechados: fechadosResult,
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchData()

    const debouncedRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current
      const delay = Math.max(2000, 3000 - timeSinceLastFetch)
      debounceRef.current = setTimeout(() => fetchData(), delay)
    }

    const channel = supabase
      .channel('sdr_queries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_locacao' },
        debouncedRefetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_vendas' },
        debouncedRefetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imovel_demand_match' },
        debouncedRefetch,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        debouncedRefetch,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [user, periodo, dataCustomStart, dataCustomEnd])

  return { data, loading }
}
