import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ExternalLink, CheckCircle2, History, PlusCircle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { sendWebhookEvent } from '@/services/n8nService'
import { format } from 'date-fns'

export function ModalDetalhesImovel({ imovel, onClose, refetch }: any) {
  const [activeTab, setActiveTab] = useState('info')
  const [matches, setMatches] = useState<any[]>([])
  const [historico, setHistorico] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    valor: imovel.preco || imovel.valor,
    obs: imovel.observacoes,
  })
  const [demandasDisponiveis, setDemandasDisponiveis] = useState<any[]>([])
  const [selectedDemandaManual, setSelectedDemandaManual] = useState<string>('')
  const [manualMatchScore, setManualMatchScore] = useState<any>(null)

  useEffect(() => {
    if (activeTab === 'compatibilidade') loadMatches()
    if (activeTab === 'historico') loadHistorico()
    if (activeTab === 'manual') loadDemandasDisponiveis()
  }, [activeTab])

  const loadMatches = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_imovel_matches', { p_imovel_id: imovel.id })
      if (error) throw error
      setMatches(data || [])
    } catch (e: any) {
      toast.error('Erro ao carregar compatibilidade: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadHistorico = async () => {
    try {
      const { data } = await supabase
        .from('imovel_demand_match')
        .select('*, demandas_locacao(cliente_nome), demandas_vendas(cliente_nome)')
        .eq('imovel_id', imovel.id)
        .order('created_at', { ascending: false })
      setHistorico(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadDemandasDisponiveis = async () => {
    try {
      const [{ data: loc }, { data: ven }] = await Promise.all([
        supabase
          .from('demandas_locacao')
          .select('id, cliente_nome, tipo, valor_maximo')
          .in('status_demanda', ['aberta', 'em busca']),
        supabase
          .from('demandas_vendas')
          .select('id, cliente_nome, tipo, valor_maximo')
          .in('status_demanda', ['aberta', 'em busca']),
      ])
      setDemandasDisponiveis([
        ...(loc || []).map((l) => ({ ...l, tipo: 'Locação' })),
        ...(ven || []).map((v) => ({ ...v, tipo: 'Venda' })),
      ])
    } catch (e) {
      console.error(e)
    }
  }

  const handleSelectManual = async (demandaId: string) => {
    setSelectedDemandaManual(demandaId)
    if (!demandaId) {
      setManualMatchScore(null)
      return
    }
    try {
      const dem = demandasDisponiveis.find((d) => d.id === demandaId)
      const { data, error } = await supabase.rpc('calculate_imovel_demand_match', {
        p_imovel_id: imovel.id,
        p_demanda_id: demandaId,
        p_tipo_demanda: dem?.tipo || 'Locação',
      })
      if (!error && data) setManualMatchScore(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('imoveis_captados')
        .update({ preco: editForm.valor, valor: editForm.valor, observacoes: editForm.obs })
        .eq('id', imovel.id)
      if (error) throw error
      toast.success('Imóvel atualizado!')
      refetch()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const addDemand = async (demanda: any, isManual = false) => {
    try {
      const demId = isManual ? demanda.id : demanda.demanda_id
      const demTipo = isManual ? demanda.tipo : demanda.tipo
      const demNome = isManual ? demanda.cliente_nome : demanda.cliente_nome
      const pct = isManual ? manualMatchScore?.compatibilidade_pct : demanda.compatibilidade_pct

      const { error: errMatch } = await supabase.from('imovel_demand_match').insert({
        imovel_id: imovel.id,
        demanda_id: demId,
        tipo_demanda: demTipo,
        captador_id: imovel.user_captador_id || imovel.captador_id,
        tipo_vinculacao: isManual ? 'manual' : 'automatico',
        compatibilidade_pct: pct,
      })
      if (errMatch) throw errMatch

      const table = demTipo === 'Locação' ? 'demandas_locacao' : 'demandas_vendas'
      await supabase.from(table).update({ status_demanda: 'em busca' }).eq('id', demId)

      const fieldToUpdate = demTipo === 'Locação' ? 'demanda_locacao_id' : 'demanda_venda_id'
      await supabase
        .from('imoveis_captados')
        .update({ [fieldToUpdate]: demId, status_captacao: 'vinculado' })
        .eq('id', imovel.id)

      toast.success(`Imóvel adicionado à demanda de ${demNome}!`)
      sendWebhookEvent({
        event_type: 'imovel_added_to_demand',
        landlord_id: 'system',
        entity_id: imovel.id,
        action: 'match',
        data: { imovel, demanda: { id: demId, tipo: demTipo } },
        timestamp: new Date().toISOString(),
      })

      if (isManual) {
        setSelectedDemandaManual('')
        setManualMatchScore(null)
      } else {
        loadMatches()
      }
      refetch()
    } catch (e: any) {
      toast.error('Erro ao vincular: ' + e.message)
    }
  }

  return (
    <Dialog open={!!imovel} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-2xl">
        <DialogHeader className="p-6 bg-white border-b border-gray-100 shrink-0">
          <DialogTitle className="text-xl font-black text-[#1A3A52]">
            Detalhes do Imóvel
          </DialogTitle>
          <DialogDescription className="font-bold text-gray-500 mt-1">
            {imovel.codigo_imovel || 'Sem código'} - {imovel.endereco}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-4 bg-white border-b border-gray-100 shrink-0 overflow-x-auto no-scrollbar">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6 rounded-none whitespace-nowrap">
              <TabsTrigger
                value="info"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Informações
              </TabsTrigger>

              <TabsTrigger
                value="compatibilidade"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Demandas Compatíveis
              </TabsTrigger>
              <TabsTrigger
                value="manual"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Adicionar Manual
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Histórico
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="info" className="mt-0 space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-4">
                <Button
                  onClick={() =>
                    window.open(
                      `https://www.eticimoveis.com.br/imovel/${imovel.codigo_imovel}`,
                      '_blank',
                    )
                  }
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Ver no Site
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                    Preço
                  </h4>
                  <p className="text-2xl font-black text-emerald-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      imovel.preco || imovel.valor || 0,
                    )}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">
                    Tipo
                  </h4>
                  <p className="text-xl font-bold text-gray-700">
                    {imovel.tipo_imovel || 'Não informado'}
                  </p>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-sm font-bold text-gray-500 mb-3">Especificações</h4>
                <div className="flex gap-4">
                  <Badge variant="outline" className="font-bold bg-slate-50">
                    {imovel.dormitorios || 0} Dormitórios
                  </Badge>
                  <Badge variant="outline" className="font-bold bg-slate-50">
                    {imovel.vagas || 0} Vagas
                  </Badge>
                </div>
              </div>
              {imovel.fotos && imovel.fotos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {imovel.fotos.map((f: string, i: number) => (
                    <img
                      key={i}
                      src={f}
                      className="h-32 w-full object-cover rounded-xl shadow-sm hover:scale-105 transition-transform"
                      alt={`Foto ${i}`}
                    />
                  ))}
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 mt-6">
                <h3 className="font-black text-[#1A3A52] text-lg">✏️ Editar Captação</h3>
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-2">Valor (R$)</label>
                  <Input
                    type="number"
                    value={editForm.valor}
                    onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
                    className="font-bold bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-2">Observações</label>
                  <Textarea
                    value={editForm.obs || ''}
                    onChange={(e) => setEditForm({ ...editForm, obs: e.target.value })}
                    className="font-medium bg-slate-50"
                    rows={4}
                  />
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full bg-[#1A3A52] font-bold h-12 hover:bg-[#1A3A52]/90"
                >
                  Salvar Alterações
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="compatibilidade"
              className="mt-0 space-y-4 animate-in fade-in duration-300"
            >
              {loading ? (
                <div className="text-center p-12 text-gray-500 font-bold bg-white rounded-2xl border border-gray-100">
                  Calculando compatibilidade com demandas abertas...
                </div>
              ) : matches.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 font-bold shadow-sm">
                  Nenhuma demanda com compatibilidade alta (&gt;=70%) encontrada no momento.
                </div>
              ) : (
                matches.map((m) => (
                  <div
                    key={m.demanda_id}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-black text-[#1A3A52] text-lg">{m.cliente_nome}</h4>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-bold uppercase tracking-wider text-[10px]"
                        >
                          {m.tipo}
                        </Badge>
                        <Badge
                          className={`font-black uppercase tracking-wider text-[10px] ${m.match_status === 'alto' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'} border-none`}
                        >
                          {m.compatibilidade_pct}% Match
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-gray-500 mb-1">
                        {m.bairros?.join(', ')} • {m.specs}
                      </p>
                      <p className="text-xs text-gray-400 font-medium">Motivos: {m.motivo}</p>
                    </div>
                    <Button
                      onClick={() => addDemand(m)}
                      className="bg-[#1A3A52] font-bold shrink-0 h-10 hover:bg-[#1A3A52]/90"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Adicionar
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-0 space-y-4 animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-black text-[#1A3A52] text-lg">
                  Vincular a uma Demanda Específica
                </h3>
                <select
                  className="w-full p-3 rounded-lg border border-gray-200 font-medium bg-slate-50 outline-none focus:border-blue-500"
                  value={selectedDemandaManual}
                  onChange={(e) => handleSelectManual(e.target.value)}
                >
                  <option value="">Selecione uma demanda aberta...</option>
                  {demandasDisponiveis.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.cliente_nome} - {d.tipo} (Até R$ {d.valor_maximo})
                    </option>
                  ))}
                </select>

                {manualMatchScore && selectedDemandaManual && (
                  <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-slate-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-gray-600">Compatibilidade:</span>
                      <Badge
                        className={
                          manualMatchScore.compatibilidade_pct >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : manualMatchScore.compatibilidade_pct >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }
                      >
                        {manualMatchScore.compatibilidade_pct}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">{manualMatchScore.motivo}</p>

                    {manualMatchScore.compatibilidade_pct < 50 && (
                      <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm flex items-center font-bold">
                        <AlertCircle className="w-4 h-4 mr-2" /> Atenção: Compatibilidade muito
                        baixa.
                      </div>
                    )}

                    <Button
                      onClick={() =>
                        addDemand(
                          demandasDisponiveis.find((d) => d.id === selectedDemandaManual),
                          true,
                        )
                      }
                      className="w-full bg-[#1A3A52] font-bold h-12"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Demanda
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="historico"
              className="mt-0 space-y-4 animate-in fade-in duration-300"
            >
              {historico.length === 0 ? (
                <div className="text-center p-8 text-gray-500 font-bold bg-white rounded-xl border border-gray-100">
                  Nenhum histórico de vinculação para este imóvel.
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white p-4 rounded-xl border border-gray-100 flex items-start gap-3"
                    >
                      <History className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Vinculado à demanda de{' '}
                          <span className="font-bold">
                            {h.demandas_locacao?.cliente_nome ||
                              h.demandas_vendas?.cliente_nome ||
                              'Desconhecido'}
                          </span>{' '}
                          ({h.tipo_demanda})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(h.created_at), 'dd/MM/yyyy HH:mm')} via{' '}
                          {h.tipo_vinculacao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
