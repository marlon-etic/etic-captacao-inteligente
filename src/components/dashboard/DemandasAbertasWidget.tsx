import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { Building2, Home, MapPin, User, Clock, Link as LinkIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

export function DemandasAbertasWidget() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { currentUser } = useAppStore()

  const fetchDemandas = async () => {
    try {
      console.log('[DEMANDAS_ABERTAS] Loading demands...')

      const { data: locacaoData, error: errLocacao } = await supabase
        .from('demandas_locacao')
        .select(
          'id, nome_cliente, cliente_nome, nivel_urgencia, valor_minimo, valor_maximo, bairros, created_at, imoveis_captados(id), users!demandas_locacao_sdr_id_fkey(nome)',
        )
        .eq('status_demanda', 'aberta')
        .order('created_at', { ascending: false })
        .limit(20)

      const { data: vendasData, error: errVendas } = await supabase
        .from('demandas_vendas')
        .select(
          'id, nome_cliente, cliente_nome, nivel_urgencia, valor_minimo, valor_maximo, bairros, created_at, imoveis_captados(id), users!demandas_vendas_corretor_id_fkey(nome)',
        )
        .eq('status_demanda', 'aberta')
        .order('created_at', { ascending: false })
        .limit(20)

      if (errLocacao) console.error('[DEMANDAS_ABERTAS] Error locacao:', errLocacao)
      if (errVendas) console.error('[DEMANDAS_ABERTAS] Error vendas:', errVendas)

      const locacao = (locacaoData || []).map((d) => ({
        ...d,
        tipo_transacao: 'Locação',
        criador: d.users?.nome || 'SDR',
        linked_count: d.imoveis_captados?.length || 0,
      }))

      const vendas = (vendasData || []).map((d) => ({
        ...d,
        tipo_transacao: 'Venda',
        criador: d.users?.nome || 'Corretor',
        linked_count: d.imoveis_captados?.length || 0,
      }))

      const all = [...locacao, ...vendas]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15)

      setDemandas(all)
      console.log('[DEMANDAS_ABERTAS] Loaded demands:', all.length)
    } catch (err) {
      console.error('[DEMANDAS_ABERTAS] Exception loading demands:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDemandas()

    const channel = supabase
      .channel('demandas_abertas_widget')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_locacao' },
        (payload) => {
          console.log('[DEMANDAS_ABERTAS] Real-time update locação:', payload)
          fetchDemandas()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_vendas' },
        (payload) => {
          console.log('[DEMANDAS_ABERTAS] Real-time update vendas:', payload)
          fetchDemandas()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getUrgencyColor = (urgency: string) => {
    const u = (urgency || '').toLowerCase()
    if (u.includes('urgente') || u.includes('crítica') || u.includes('critica'))
      return 'bg-red-500 hover:bg-red-600 text-white border-none'
    if (u.includes('alta') || u.includes('15 dias'))
      return 'bg-orange-500 hover:bg-orange-600 text-white border-none'
    if (u.includes('média') || u.includes('media') || u.includes('30 dias'))
      return 'bg-yellow-500 hover:bg-yellow-600 text-white border-none'
    return 'bg-blue-500 hover:bg-blue-600 text-white border-none'
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val || 0)
  }

  const handleCardClick = (id: string, tipoTransacao: string) => {
    const type = tipoTransacao === 'Locação' ? 'locacao' : 'vendas'
    const role = currentUser?.role
    if (role === 'sdr' || role === 'corretor') {
      navigate(`/app/sdr-corretor/dashboard?tab=minhas-demandas&demandId=${id}&type=${type}`)
    } else if (role === 'captador') {
      navigate(`/app/buscar-imoveis?demanda_id=${id}`)
    } else {
      navigate(
        `/app?tab=todas-demandas-${type === 'locacao' ? 'aluguel' : 'venda'}&demandId=${id}&type=${type}`,
      )
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (demandas.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">Nenhuma demanda aberta no momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {demandas.map((d) => (
        <Card
          key={d.id}
          onClick={() => handleCardClick(d.id, d.tipo_transacao)}
          className="p-4 rounded-xl border border-gray-200 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:shadow-md group flex flex-col h-full bg-white relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 group-hover:bg-blue-500 transition-colors"></div>

          <div className="flex justify-between items-start mb-3 pl-2">
            <div>
              <h3
                className="font-bold text-[#1A3A52] text-[16px] leading-tight line-clamp-1"
                title={d.nome_cliente || d.cliente_nome}
              >
                {d.nome_cliente || d.cliente_nome || 'Cliente'}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 font-bold">
                {d.tipo_transacao === 'Locação' ? (
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Home className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="uppercase tracking-wider">{d.tipo_transacao}</span>
              </div>
            </div>
            <Badge
              className={cn(
                'text-[10px] uppercase font-bold whitespace-nowrap shadow-sm',
                getUrgencyColor(d.nivel_urgencia),
              )}
            >
              {d.nivel_urgencia || 'Média'}
            </Badge>
          </div>

          <div className="pl-2 space-y-2 mb-4 flex-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Budget</span>
              <span className="font-black text-emerald-600 text-sm">
                {formatCurrency(d.valor_minimo)} - {formatCurrency(d.valor_maximo)}
              </span>
            </div>

            <div className="flex flex-col mt-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Bairros</span>
              <span
                className="text-xs font-medium text-gray-700 line-clamp-1"
                title={d.bairros?.join(', ')}
              >
                <MapPin className="w-3 h-3 inline mr-1 text-gray-400" />
                {d.bairros?.join(', ') || 'Não especificado'}
              </span>
            </div>
          </div>

          <div className="pl-2 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-auto font-medium">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1" title="Criador">
                <User className="w-3 h-3 text-gray-400" /> {d.criador.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1" title="Data">
                <Clock className="w-3 h-3 text-gray-400" />
                {new Date(d.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {d.linked_count > 0 && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
              >
                <LinkIcon className="w-3 h-3 mr-1" /> {d.linked_count} imov.
              </Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}
