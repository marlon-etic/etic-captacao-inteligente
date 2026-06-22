import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sendWebhookEvent } from '@/services/n8nService'
import {
  MapPin,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Search,
  Clock,
  BedDouble,
  Car,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function BuscarImoveisTab() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const userRole = user?.user_metadata?.role || user?.app_metadata?.role

  const [filtros, setFiltros] = useState({
    status: 'todas',
    tipo: userRole === 'sdr' || userRole === 'SDR' ? 'Locação' : 'todas',
    busca: '',
  })
  const [imovelSelecionado, setImovelSelecionado] = useState<any>(null)
  const [isVinculadorOpen, setIsVinculadorOpen] = useState(false)
  const [openedFromDetalhes, setOpenedFromDetalhes] = useState(false)
  const [demandasAtivas, setDemandasAtivas] = useState<any[]>([])
  const [isNovaDemanda, setIsNovaDemanda] = useState(false)
  const [novaDemandaForm, setNovaDemandaForm] = useState({
    nome: '',
    bairros: '',
    budgetMin: '',
    budgetMax: '',
    dorms: '',
    vagas: '',
    urgencia: 'Normal',
  })

  const fetchImoveis = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('imoveis_captados')
      .select(
        `*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*), users:user_captador_id(nome, email)`,
      )
      .order('created_at', { ascending: false })
    if (data) setImoveis(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchImoveis()

    const params = new URLSearchParams(window.location.search)
    const imovelId = params.get('imovel_id')
    const modal = params.get('modal')
    if (modal === 'aberto' && imovelId) {
      supabase
        .from('imoveis_captados')
        .select(
          `*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*), users:user_captador_id(nome, email)`,
        )
        .eq('id', imovelId)
        .single()
        .then(({ data }) => {
          if (data) setImovelSelecionado(data)
        })
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const sub = supabase
      .channel('imoveis_captados_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          if (payload.new) {
            supabase
              .from('imoveis_captados')
              .select(
                `*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*), users:user_captador_id(nome, email)`,
              )
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  setImoveis((prev) => {
                    const exists = prev.find((i) => i.id === data.id)
                    if (exists) return prev.map((im) => (im.id === data.id ? data : im))
                    return [data, ...prev]
                  })
                  setImovelSelecionado((curr) => (curr?.id === data.id ? data : curr))
                }
              })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
    }
  }, [])

  const loadDemandasAtivas = async () => {
    const table = userRole === 'corretor' ? 'demandas_vendas' : 'demandas_locacao'
    const field = userRole === 'corretor' ? 'corretor_id' : 'sdr_id'
    let query = supabase
      .from(table)
      .select('*')
      .in('status_demanda', ['aberta', 'atendida', 'em busca'])
    if (userRole !== 'admin' && userRole !== 'gestor') {
      query = query.eq(field, user?.id)
    }
    const { data } = await query
    if (data) setDemandasAtivas(data)
  }

  const openVinculador = () => {
    setOpenedFromDetalhes(true)
    loadDemandasAtivas()
    setIsVinculadorOpen(true)
  }

  const handleAbrirDetalhes = (im: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    console.log('handleAbrirDetalhes chamado com id:', im.id)
    setImovelSelecionado(im)
  }

  const handleVincularClick = (im: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    console.log('handleVincular chamado com id:', im.id)
    setImovelSelecionado(im)
    setOpenedFromDetalhes(false)
    loadDemandasAtivas()
    setIsVinculadorOpen(true)
  }

  const handleVincular = async (demanda: any) => {
    const isVenda = demanda.tipo_demanda === 'Venda' || userRole === 'corretor'
    const updateData = isVenda
      ? {
          demanda_venda_id: demanda.id,
          status_captacao: 'capturado',
          etapa_funil: 'vinculado',
        }
      : {
          demanda_locacao_id: demanda.id,
          status_captacao: 'capturado',
          etapa_funil: 'vinculado',
        }

    const { error } = await supabase
      .from('imoveis_captados')
      .update(updateData)
      .eq('id', imovelSelecionado.id)

    if (!error) {
      await supabase.from('imovel_demand_match').insert({
        imovel_id: imovelSelecionado.id,
        demanda_id: demanda.id,
        tipo_demanda: isVenda ? 'Venda' : 'Locação',
        captador_id: imovelSelecionado.user_captador_id || imovelSelecionado.captador_id,
        tipo_vinculacao: 'manual',
        compatibilidade_pct: 100,
      })

      toast({
        title: `Imóvel vinculado a ${demanda.nome_cliente || demanda.cliente_nome}! ✅`,
        className: 'bg-green-600 text-white border-green-700',
      })
      setIsVinculadorOpen(false)
      setIsNovaDemanda(false)
      if (!openedFromDetalhes) {
        setImovelSelecionado(null)
      }

      await sendWebhookEvent({
        event_type: 'imovel_vinculado',
        landlord_id: 'system',
        entity_id: imovelSelecionado.id,
        action: 'vinculacao_manual',
        data: { imovel_id: imovelSelecionado.id, demanda_id: demanda.id, user_id: user?.id },
        timestamp: new Date().toISOString(),
      })
    } else {
      toast({ title: 'Erro ao vincular', description: error.message, variant: 'destructive' })
    }
  }

  const handleCriarEVincular = async (e: any) => {
    e.preventDefault()
    const table = userRole === 'corretor' ? 'demandas_vendas' : 'demandas_locacao'
    const field = userRole === 'corretor' ? 'corretor_id' : 'sdr_id'

    const { data: newDemanda, error } = await supabase
      .from(table)
      .insert({
        nome_cliente: novaDemandaForm.nome,
        bairros: novaDemandaForm.bairros.split(',').map((b) => b.trim()),
        valor_minimo: Number(novaDemandaForm.budgetMin),
        valor_maximo: Number(novaDemandaForm.budgetMax),
        dormitorios: Number(novaDemandaForm.dorms),
        vagas_estacionamento: Number(novaDemandaForm.vagas),
        nivel_urgencia: novaDemandaForm.urgencia,
        status_demanda: 'aberta',
        [field]: user?.id,
      })
      .select('*')
      .single()

    if (newDemanda && !error) {
      await handleVincular(newDemanda)
    } else {
      toast({ title: 'Erro ao criar demanda', description: error?.message, variant: 'destructive' })
    }
  }

  const getStatusBadge = (imovel: any) => {
    const demanda = imovel.demanda_locacao || imovel.demanda_venda
    if (!demanda) return <Badge className="bg-gray-100 text-gray-800">⏳ Aberto</Badge>
    const status = demanda.status_demanda
    if (status === 'atendida' || status === 'ganho')
      return <Badge className="bg-green-100 text-green-800">✅ Atendido</Badge>
    if (status === 'impossivel')
      return <Badge className="bg-red-100 text-red-800">❌ Impossível</Badge>
    if (status === 'perdida' || status === 'PERDIDA_BAIXA')
      return <Badge className="bg-red-800 text-white">🔴 Perdido</Badge>
    if (demanda.is_prioritaria)
      return <Badge className="bg-yellow-100 text-yellow-800">⭐ Priorizado</Badge>
    return <Badge className="bg-blue-100 text-blue-800">Vinculado</Badge>
  }

  const imoveisFiltrados = imoveis.filter((im) => {
    const demanda = im.demanda_locacao || im.demanda_venda
    if (filtros.status !== 'todas') {
      if (filtros.status === 'disponivel' && demanda) return false
      if (filtros.status === 'vinculado' && !demanda) return false
    }
    if (filtros.tipo !== 'todas' && im.tipo !== filtros.tipo) return false
    if (filtros.busca) {
      const search = filtros.busca.toLowerCase()
      const matchCodigo = String(im.codigo_imovel).toLowerCase().includes(search)
      const matchEndereco = String(im.localizacao_texto || im.endereco)
        .toLowerCase()
        .includes(search)
      if (!matchCodigo && !matchEndereco) return false
    }
    return true
  })

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2 items-center w-full md:w-1/2">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            placeholder="Buscar por código ou bairro..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            className="border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          <Select
            value={filtros.status}
            onValueChange={(v) => setFiltros({ ...filtros, status: v })}
          >
            <SelectTrigger className="w-[140px] shrink-0 font-medium bg-gray-50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos Status</SelectItem>
              <SelectItem value="disponivel">⏳ Disponível</SelectItem>
              <SelectItem value="vinculado">🔗 Vinculado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtros.tipo} onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}>
            <SelectTrigger className="w-[140px] shrink-0 font-medium bg-gray-50">
              <SelectValue placeholder="Transação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos Tipos</SelectItem>
              <SelectItem value="Locação">Locação</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : imoveisFiltrados.length === 0 ? (
        <div className="text-center py-24 text-gray-500 border border-dashed rounded-xl bg-gray-50/50">
          Nenhum imóvel encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {imoveisFiltrados.map((im) => {
            const demanda = im.demanda_locacao || im.demanda_venda
            return (
              <div
                key={im.id}
                onClick={() => setImovelSelecionado(im)}
                className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 duration-200 flex flex-col ${demanda ? 'border-green-100/80 bg-green-50/30' : 'border-gray-100'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="font-black text-gray-600">
                    #{im.codigo_imovel || im.id.split('-')[0]}
                  </span>
                  {getStatusBadge(im)}
                </div>

                <h3 className="font-bold text-[17px] text-[#1A3A52] mb-1 leading-snug">
                  {im.localizacao_texto || im.endereco || 'Endereço não informado'}
                </h3>

                <div className="text-2xl font-black text-emerald-600 mb-3">
                  {formatter.format(im.preco || im.valor || 0)}
                  {im.tipo === 'Locação' && (
                    <span className="text-sm text-gray-500 font-medium">/mês</span>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <Badge variant="outline" className="text-xs bg-gray-50 font-bold border-gray-200">
                    {im.tipo || 'Ambos'}
                  </Badge>
                  {im.dormitorios > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-gray-50 font-bold border-gray-200"
                    >
                      {im.dormitorios} Dorms
                    </Badge>
                  )}
                </div>

                {demanda && (
                  <div className="bg-white p-2.5 rounded-lg border border-green-100 text-sm mb-4 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div className="truncate">
                      <span className="text-gray-500 text-xs mr-1">Vinculado a:</span>
                      <strong className="text-gray-800">
                        {demanda.nome_cliente || demanda.cliente_nome}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100 font-medium mb-3">
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Há {formatDistanceToNow(new Date(im.created_at), { locale: ptBR })}
                  </div>
                  <div>{im.users?.nome || im.users?.email?.split('@')[0] || 'Captador'}</div>
                </div>

                <div
                  className="flex gap-2 pt-3 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    className="flex-1 font-bold text-gray-600 border-gray-300"
                    onClick={(e) => handleAbrirDetalhes(im, e)}
                    data-testid="btn-detalhes"
                  >
                    Detalhes
                  </Button>
                  {!demanda && (
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white shadow-sm"
                      onClick={(e) => handleVincularClick(im, e)}
                      data-testid="btn-vincular"
                    >
                      Vincular
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={!!imovelSelecionado && !isVinculadorOpen}
        onOpenChange={(o) => !o && setImovelSelecionado(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gray-50 border-none shadow-2xl rounded-2xl w-[95vw] md:w-full">
          {imovelSelecionado &&
            (() => {
              const im = imovelSelecionado
              const demanda = im.demanda_locacao || im.demanda_venda

              return (
                <>
                  <div className="p-5 md:p-6 bg-white border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-black text-[#1A3A52]">
                          #{im.codigo_imovel || im.id.split('-')[0]}
                        </h2>
                        <p className="text-gray-500 font-medium flex items-center mt-1 text-sm md:text-base">
                          <MapPin className="w-4 h-4 mr-1 shrink-0" />{' '}
                          {im.localizacao_texto || im.endereco}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl md:text-3xl font-black text-emerald-600">
                          {formatter.format(im.preco || im.valor || 0)}
                        </div>
                        <Badge className="mt-1 font-bold">{im.tipo}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-sm">
                        <BedDouble className="w-4 h-4 mr-2 text-gray-400" /> {im.dormitorios || 0}{' '}
                        Dorms
                      </div>
                      <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-sm">
                        <Car className="w-4 h-4 mr-2 text-gray-400" /> {im.vagas || 0} Vagas
                      </div>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                    {demanda ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]">
                        <h3 className="font-black text-blue-900 flex items-center mb-4">
                          <Search className="w-5 h-5 mr-2" /> Dados do Cliente (Demanda)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="col-span-2 md:col-span-2">
                            <span className="text-blue-700/70 text-[11px] font-black uppercase block mb-1">
                              Nome do Cliente
                            </span>
                            <span className="font-bold text-blue-950 text-base">
                              {demanda.nome_cliente || demanda.cliente_nome}
                            </span>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <span className="text-blue-700/70 text-[11px] font-black uppercase block mb-1">
                              Budget Máx
                            </span>
                            <span className="font-black text-emerald-600 text-base">
                              {formatter.format(demanda.valor_maximo || 0)}
                            </span>
                          </div>
                          <div className="col-span-2 md:col-span-1">
                            <span className="text-blue-700/70 text-[11px] font-black uppercase block mb-1">
                              Status
                            </span>
                            <span className="font-bold text-blue-900 text-sm uppercase">
                              {demanda.status_demanda}
                            </span>
                          </div>
                          <div className="col-span-2 md:col-span-4">
                            <span className="text-blue-700/70 text-[11px] font-black uppercase block mb-1">
                              Bairros Desejados
                            </span>
                            <span className="font-bold text-blue-950 text-sm">
                              {demanda.bairros?.join(', ') || 'Nenhum bairro específico'}
                            </span>
                          </div>
                          <div className="col-span-2 md:col-span-2">
                            <span className="text-blue-700/70 text-[11px] font-black uppercase block mb-1">
                              Urgência
                            </span>
                            <span className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                              <div
                                className={`w-2 h-2 rounded-full ${demanda.nivel_urgencia === 'Alta' || demanda.nivel_urgencia === 'Urgente' ? 'bg-red-500' : demanda.nivel_urgencia === 'Normal' ? 'bg-yellow-500' : 'bg-green-500'}`}
                              ></div>
                              {demanda.nivel_urgencia || 'Normal'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-black text-gray-800 mb-2">Observações da Captação</h3>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                          {im.observacoes || 'Nenhuma observação registrada pelo captador.'}
                        </p>
                      </div>
                    )}

                    {im.fotos && im.fotos.length > 0 && (
                      <div>
                        <h3 className="font-black text-gray-800 mb-3">
                          Galeria de Fotos ({im.fotos.length})
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-3 snap-x scrollbar-hide">
                          {im.fotos.map((f: string, i: number) => (
                            <img
                              key={i}
                              src={f}
                              className="h-32 w-48 object-cover rounded-xl flex-shrink-0 snap-start shadow-sm"
                              alt="Foto"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100 flex justify-between gap-3 shrink-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="font-bold text-gray-600 h-12 px-4 border-gray-300"
                        onClick={() =>
                          window.open(
                            `https://eticimoveis.com.br/imovel/${im.codigo_imovel}`,
                            '_blank',
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">Ver no Site</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="font-bold text-gray-600 h-12 w-12 px-0 border-gray-300"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `https://eticimoveis.com.br/imovel/${im.codigo_imovel}`,
                          )
                          toast({ title: 'Link copiado!' })
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {!demanda && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 font-black h-12 px-6 shadow-[0_4px_12px_rgba(16,185,129,0.3)] text-white"
                        onClick={openVinculador}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" /> Vincular a Demanda
                      </Button>
                    )}
                  </div>
                </>
              )
            })()}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isVinculadorOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsVinculadorOpen(false)
            setIsNovaDemanda(false)
            if (!openedFromDetalhes) {
              setImovelSelecionado(null)
            }
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 bg-gray-50 border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[85vh] w-[95vw] md:w-full">
          <DialogHeader className="p-6 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10">
            <DialogTitle className="text-xl font-black text-[#1A3A52]">
              Vincular a uma Demanda
            </DialogTitle>
            <DialogDescription className="font-medium text-gray-500 mt-1">
              Selecione uma demanda ativa na lista ou crie uma nova para vincular a este imóvel
              instantaneamente.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            {isNovaDemanda ? (
              <form
                onSubmit={handleCriarEVincular}
                className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-right-4 duration-300"
              >
                <h3 className="font-black text-[#1A3A52] border-b border-gray-100 pb-3 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-emerald-600" /> Criação Rápida de Demanda
                </h3>

                <div>
                  <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                    Nome do Cliente *
                  </label>
                  <Input
                    required
                    value={novaDemandaForm.nome}
                    onChange={(e) =>
                      setNovaDemandaForm({ ...novaDemandaForm, nome: e.target.value })
                    }
                    className="h-11 font-medium bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                    Bairros (separados por vírgula) *
                  </label>
                  <Input
                    required
                    value={novaDemandaForm.bairros}
                    onChange={(e) =>
                      setNovaDemandaForm({ ...novaDemandaForm, bairros: e.target.value })
                    }
                    className="h-11 font-medium bg-gray-50"
                    placeholder="Ex: Tatuapé, Mooca"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                      Budget Mínimo *
                    </label>
                    <Input
                      type="number"
                      required
                      value={novaDemandaForm.budgetMin}
                      onChange={(e) =>
                        setNovaDemandaForm({ ...novaDemandaForm, budgetMin: e.target.value })
                      }
                      className="h-11 font-medium bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                      Budget Máximo *
                    </label>
                    <Input
                      type="number"
                      required
                      value={novaDemandaForm.budgetMax}
                      onChange={(e) =>
                        setNovaDemandaForm({ ...novaDemandaForm, budgetMax: e.target.value })
                      }
                      className="h-11 font-medium bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                      Dormitórios *
                    </label>
                    <Input
                      type="number"
                      required
                      value={novaDemandaForm.dorms}
                      onChange={(e) =>
                        setNovaDemandaForm({ ...novaDemandaForm, dorms: e.target.value })
                      }
                      className="h-11 font-medium bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                      Vagas
                    </label>
                    <Input
                      type="number"
                      value={novaDemandaForm.vagas}
                      onChange={(e) =>
                        setNovaDemandaForm({ ...novaDemandaForm, vagas: e.target.value })
                      }
                      className="h-11 font-medium bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-gray-500 uppercase mb-1.5 block">
                    Urgência
                  </label>
                  <Select
                    value={novaDemandaForm.urgencia}
                    onValueChange={(v) => setNovaDemandaForm({ ...novaDemandaForm, urgencia: v })}
                  >
                    <SelectTrigger className="h-11 font-medium bg-gray-50">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3 h-12 font-bold text-gray-600"
                    onClick={() => setIsNovaDemanda(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="w-2/3 h-12 bg-emerald-600 hover:bg-emerald-700 font-black shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                  >
                    Criar e Vincular
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
                  <h3 className="font-black text-gray-800 hidden md:block">Suas Demandas Ativas</h3>
                  <Button
                    onClick={() => setIsNovaDemanda(true)}
                    className="bg-blue-600 hover:bg-blue-700 h-10 w-full md:w-auto font-bold shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Nova Demanda
                  </Button>
                </div>

                <div className="space-y-3">
                  {demandasAtivas.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl text-gray-500 border border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-bold text-gray-700">Nenhuma demanda ativa encontrada.</p>
                      <p className="text-sm mt-1">
                        Crie uma nova demanda para vincular este imóvel.
                      </p>
                    </div>
                  ) : (
                    demandasAtivas.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 md:p-5 bg-white rounded-xl border-2 border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
                      >
                        <div className="w-full md:w-auto">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="font-black text-[#1A3A52] text-[17px]">
                              {d.nome_cliente || d.cliente_nome}
                            </div>
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${d.nivel_urgencia === 'Alta' || d.nivel_urgencia === 'Urgente' ? 'bg-red-500' : d.nivel_urgencia === 'Normal' ? 'bg-yellow-500' : 'bg-green-500'}`}
                            ></div>
                          </div>
                          <div className="text-[13px] font-medium text-gray-500 leading-snug">
                            {d.bairros?.join(', ')}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[13px]">
                            <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              Até {formatter.format(d.valor_maximo || 0)}
                            </span>
                            <span className="font-bold text-gray-600 flex items-center">
                              <BedDouble className="w-3.5 h-3.5 mr-1 text-gray-400" />{' '}
                              {d.dormitorios}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleVincular(d)}
                          className="w-full md:w-auto md:opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-700 font-black h-11 md:h-10 px-6 shadow-sm"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" /> Vincular a Esta
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
