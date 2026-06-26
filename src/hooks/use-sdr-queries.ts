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
    const isAdmin = role === 'admin' || role === 'gestor'
    const isCaptador = role === 'captador'
    const isCorretor = role === 'corretor' || role === 'broker'
    const isSdr = role === 'sdr'

    async function fetchData() {
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

        let todasDemandas: any[] = []
        let demandasInativas: any[] = []
        let visitas: any[] = []
        let fechados: any[] = []

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
          if (applyDateFilter) {
            queryCreated = queryCreated.gte('created_at', startIso).lte('created_at', endIso)
          }
          queryCreated = queryCreated.order('updated_at', { ascending: false, nullsFirst: false })

          let queryActive = supabase
            .from(tabela)
            .select(fields)
            .in('status_demanda', ['aberta', 'em busca', 'em visita'])

          if (visibility === 'own') queryActive = queryActive.eq(ownerField, user.id)
          // Always show active demands regardless of created_at period filter

          let inativasQuery = supabase
            .from(tabela)
            .select(fields)
            .in('status_demanda', ['aberta', 'em busca', 'em visita'])
            .not('updated_at', 'is', null)
            .lt('updated_at', seteDiasAtrasIso)

          if (visibility === 'own') inativasQuery = inativasQuery.eq(ownerField, user.id)
          // Inactive demands can also be exempt from period filter if we want all inactive

          const [{ data: dCreated }, { data: dActive }, { data: inativas }] = await Promise.all([
            queryCreated,
            queryActive,
            inativasQuery,
          ])

          // Combine created and active, removing duplicates by id
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
        const resLocacao = await fetchDemandas(
          'demandas_locacao',
          'sdr_id',
          'Locação',
          'observacoes',
          visLocacao,
        )
        todasDemandas = [...todasDemandas, ...resLocacao.demandas]
        demandasInativas = [...demandasInativas, ...resLocacao.inativas]

        const visVendas = isAdmin || isCaptador || isCorretor ? 'all' : 'own'
        const resVendas = await fetchDemandas(
          'demandas_vendas',
          'corretor_id',
          'Venda',
          'necessidades_especificas',
          visVendas,
        )
        todasDemandas = [...todasDemandas, ...resVendas.demandas]
        demandasInativas = [...demandasInativas, ...resVendas.inativas]

        let imoveisBase = supabase
          .from('imoveis_captados')
          .select(
            'id, codigo_imovel, endereco, preco, valor, created_at, updated_at, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, user_captador_id, demanda_locacao_id, demanda_venda_id, imovel_demand_match(id, demanda_id, tipo_vinculacao)',
          )

        if (!isAdmin) {
          if (isCaptador) imoveisBase = imoveisBase.eq('user_captador_id', user.id)
          else if (isSdr) imoveisBase = imoveisBase.in('tipo', ['Locação', 'Ambos'])
          else if (isCorretor) imoveisBase = imoveisBase.in('tipo', ['Venda', 'Ambos'])
        }

        let qCreated = imoveisBase
        if (applyDateFilter) {
          qCreated = qCreated.gte('created_at', startIso).lte('created_at', endIso)
        }
        qCreated = qCreated.order('updated_at', { ascending: false, nullsFirst: false }).limit(500)

        // Active Stock: Do NOT apply date filter
        let qActive = imoveisBase
          .in('status_captacao', ['ativo', 'em captacao', 'em_captacao', 'Ativo'])
          .limit(1000)

        const [{ data: imCreated }, { data: imActive }] = await Promise.all([qCreated, qActive])

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

          for (let i = 0; i < sdrDemandaIds.length; i += chunkSize) {
            const chunk = sdrDemandaIds.slice(i, i + chunkSize)
            const { data: imV } = await supabase
              .from('imovel_demand_match')
              .select(
                'id, demanda_id, tipo_vinculacao, compatibilidade_pct, imovel_id, imoveis_captados(id, codigo_imovel, endereco, preco, valor, created_at, updated_at, user_captador_id, tipo, tipo_imovel, etapa_funil, status_captacao, dormitorios, vagas, banheiros, fotos, observacoes, localizacao_texto, users!imoveis_captados_user_captador_id_fkey(nome))',
              )
              .in('demanda_id', chunk)

            if (imV) imVList = [...imVList, ...imV]
          }

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

        if (!isCaptador) {
          const fetchActivities = async (tabela: string, dataField: string) => {
            let q = supabase.from(tabela).select('*')
            if (!isAdmin) q = q.eq('user_sdr_id', user.id)
            if (applyDateFilter) q = q.gte('created_at', startIso).lte('created_at', endIso)
            q = q.order(dataField, { ascending: false })
            const { data } = await q
            return data || []
          }

          visitas = await fetchActivities('visitas_imovel', 'data_visita')
          fechados = await fetchActivities('fechamentos', 'created_at')
        }

        setData({
          demandas: todasDemandas,
          demandasInativas,
          imoveisLivres: imoveisLivresFiltered,
          imoveisSobDemanda,
          visitas,
          fechados,
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_locacao' },
        fetchData,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_vendas' }, fetchData)
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
