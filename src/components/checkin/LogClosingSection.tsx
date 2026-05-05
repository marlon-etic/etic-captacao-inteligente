import React, { useState } from 'react'
import { Handshake, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { checkinService, CheckinDemanda } from '@/services/checkinService'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { sendWebhookEvent } from '@/services/n8nService'
import { trackEvent } from '@/lib/analytics'

import { useEffect } from 'react'

export function LogClosingSection({
  demands,
  properties,
  onClosingLogged,
}: {
  demands: CheckinDemanda[]
  properties: any[]
  onClosingLogged: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDemanda, setSelectedDemanda] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [valor, setValor] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedClosings, setLoggedClosings] = useState<any[]>([])

  const loadClosings = () => {
    if (user) checkinService.getTodayClosings(user.id).then(setLoggedClosings)
  }

  useEffect(() => {
    loadClosings()
  }, [user, demands])

  const handleSave = async () => {
    if (!selectedDemanda || !valor || !dataPrevista || !user) return
    setLoading(true)
    try {
      const demanda = demands.find((d) => d.id === selectedDemanda)
      if (!demanda) throw new Error('Demanda não encontrada')

      await checkinService.registerFechamento({
        demanda_id: demanda.id,
        tipo_demanda: demanda.tipo,
        imovel_id: selectedProperty || undefined,
        valor: Number(valor),
        data_prevista: dataPrevista,
        user_sdr_id: user.id,
      })

      const today = await checkinService.getTodayStats(user.id)
      await checkinService.updateTodayStats(user.id, { fechamentos: (today?.fechamentos || 0) + 1 })
      await checkinService.updateAcompanhamentoDiario(user.id, { clientes_em_fechamento: 1 })

      await sendWebhookEvent({
        event_type: 'fechamento_registrado',
        entity_id: demanda.id,
        landlord_id: 'system',
        action: 'create',
        data: { cliente: demanda.nome_cliente, valor },
        timestamp: new Date().toISOString(),
      })

      toast({ title: 'Fechamento registrado com sucesso!' })

      trackEvent(user.id, 'deal_closed', {
        demand_id: demanda.id,
        property_id: selectedProperty || undefined,
        deal_value: Number(valor),
      })

      setSelectedDemanda('')
      setSelectedProperty('')
      setValor('')
      setDataPrevista('')
      loadClosings()
      onClosingLogged()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar fechamento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Handshake className="text-[#10B981] w-5 h-5" />
        <h3 className="font-semibold text-gray-800">Clientes EM FECHAMENTO?</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Selecione o cliente pronto para fechar
          </Label>
          <select
            className="w-full p-2 border rounded-md text-sm"
            value={selectedDemanda}
            onChange={(e) => setSelectedDemanda(e.target.value)}
          >
            <option value="">-- Selecione --</option>
            {demands.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome_cliente} ({d.tipo})
              </option>
            ))}
          </select>
        </div>

        {selectedDemanda && (
          <div className="space-y-4 pt-2 border-t animate-fade-in">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                Qual imóvel ele vai fechar?
              </Label>
              <select
                className="w-full p-2 border rounded-md text-sm"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="">-- Opcional (Selecione Imóvel) --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_imovel} - {p.endereco}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Valor do Fechamento *</Label>
                <Input
                  type="number"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="Ex: 2500"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Data Prevista *</Label>
                <Input
                  type="date"
                  value={dataPrevista}
                  onChange={(e) => setDataPrevista(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || !valor || !dataPrevista}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Registrar Fechamento
            </Button>
          </div>
        )}

        {loggedClosings.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Fechamentos registrados hoje:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              {loggedClosings.map((c) => {
                const dem = demands.find((d) => d.id === c.demanda_id)
                return (
                  <li
                    key={c.id}
                    className="flex flex-col bg-gray-50 p-2 rounded border border-gray-100"
                  >
                    <span className="font-semibold text-gray-800">
                      {dem?.nome_cliente || 'Cliente'}
                    </span>
                    <span className="text-gray-500">
                      Vai fechar em {new Date(c.data_prevista).toLocaleDateString()}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
