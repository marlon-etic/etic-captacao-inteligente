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
import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { sendWebhookEvent } from '@/services/n8nService'

export function ModalDetalhesImovel({ imovel, onClose, refetch }: any) {
  const [activeTab, setActiveTab] = useState('info')
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    valor: imovel.preco || imovel.valor,
    obs: imovel.observacoes,
  })

  useEffect(() => {
    if (activeTab === 'compatibilidade') {
      loadMatches()
    }
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

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('imoveis_captados')
        .update({
          preco: editForm.valor,
          valor: editForm.valor,
          observacoes: editForm.obs,
        })
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

  const addDemand = async (demanda: any) => {
    try {
      const { error: errMatch } = await supabase.from('imovel_demand_match').insert({
        imovel_id: imovel.id,
        demanda_id: demanda.demanda_id,
        tipo_demanda: demanda.tipo,
        captador_id: imovel.user_captador_id || imovel.captador_id,
        tipo_vinculacao: 'automatico',
        compatibilidade_pct: demanda.compatibilidade_pct,
      })
      if (errMatch) throw errMatch

      const table = demanda.tipo === 'Locação' ? 'demandas_locacao' : 'demandas_vendas'
      await supabase.from(table).update({ status_demanda: 'em busca' }).eq('id', demanda.demanda_id)

      toast.success(`Imóvel adicionado à demanda de ${demanda.cliente_nome}!`)

      sendWebhookEvent({
        event_type: 'imovel_added_to_demand',
        landlord_id: 'system',
        entity_id: imovel.id,
        action: 'match',
        data: { imovel, demanda },
        timestamp: new Date().toISOString(),
      })

      loadMatches()
      refetch()
    } catch (e: any) {
      toast.error('Erro ao vincular: ' + e.message)
    }
  }

  return (
    <Dialog open={!!imovel} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl rounded-2xl">
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
          <div className="px-6 pt-4 bg-white border-b border-gray-100 shrink-0">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-6 rounded-none">
              <TabsTrigger
                value="info"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Informações
              </TabsTrigger>
              <TabsTrigger
                value="acoes"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Ações Rápidas
              </TabsTrigger>
              <TabsTrigger
                value="compatibilidade"
                className="data-[state=active]:border-b-[3px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] font-bold text-gray-500 data-[state=active]:shadow-none rounded-none px-0 pb-3 transition-colors"
              >
                Demandas Compatíveis
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="info" className="mt-0 space-y-6 animate-in fade-in duration-300">
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
            </TabsContent>

            <TabsContent value="acoes" className="mt-0 space-y-6 animate-in fade-in duration-300">
              <div className="flex gap-4 mb-6">
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
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
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
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
