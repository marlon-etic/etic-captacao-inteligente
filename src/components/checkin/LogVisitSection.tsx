import React, { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { checkinService, CheckinDemanda } from '@/services/checkinService'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { sendWebhookEvent } from '@/services/n8nService'

export function LogVisitSection({
  demands,
  properties,
  onVisitLogged,
}: {
  demands: CheckinDemanda[]
  properties: any[]
  onVisitLogged: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDemanda, setSelectedDemanda] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [isNewProperty, setIsNewProperty] = useState(false)
  const [newPropAddress, setNewPropAddress] = useState('')
  const [newPropValue, setNewPropValue] = useState('')
  const [qtd, setQtd] = useState('1')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!selectedDemanda || !user) return
    setLoading(true)
    try {
      const demanda = demands.find((d) => d.id === selectedDemanda)
      if (!demanda) throw new Error('Demanda não encontrada')

      await checkinService.registerVisita({
        demanda_id: demanda.id,
        tipo_demanda: demanda.tipo,
        imovel_id: !isNewProperty && selectedProperty ? selectedProperty : undefined,
        novo_imovel_endereco: isNewProperty ? newPropAddress : undefined,
        novo_imovel_valor: isNewProperty ? Number(newPropValue) : undefined,
        qtd_imoveis_visitados: Number(qtd) || 1,
        user_sdr_id: user.id,
      })

      const today = await checkinService.getTodayStats(user.id)
      await checkinService.updateTodayStats(user.id, { visitas: (today?.visitas || 0) + 1 })

      await sendWebhookEvent({
        event_type: 'visita_registrada',
        entity_id: demanda.id,
        landlord_id: 'system',
        action: 'create',
        data: {
          cliente: demanda.nome_cliente,
          imovel: isNewProperty ? newPropAddress : selectedProperty,
        },
        timestamp: new Date().toISOString(),
      })

      toast({ title: 'Visita registrada com sucesso!' })
      setSelectedDemanda('')
      setSelectedProperty('')
      setIsNewProperty(false)
      setNewPropAddress('')
      setNewPropValue('')
      setQtd('1')
      onVisitLogged()
    } catch (err: any) {
      toast({ title: 'Erro ao registrar visita', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="text-[#0070f3] w-5 h-5" />
        <h3 className="font-semibold text-gray-800">Clientes EM VISITA hoje?</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">
            Selecione o cliente que está em visita
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
              <Label className="text-xs text-gray-500 mb-1 block">Qual imóvel ele visitou?</Label>
              <select
                className="w-full p-2 border rounded-md text-sm mb-2"
                value={isNewProperty ? 'new' : selectedProperty}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setIsNewProperty(true)
                    setSelectedProperty('')
                  } else {
                    setIsNewProperty(false)
                    setSelectedProperty(e.target.value)
                  }
                }}
              >
                <option value="">-- Selecione Imóvel --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo_imovel} - {p.endereco}
                  </option>
                ))}
                <option value="new">+ Novo Imóvel (Não captado)</option>
              </select>

              {isNewProperty && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input
                    placeholder="Endereço"
                    value={newPropAddress}
                    onChange={(e) => setNewPropAddress(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Valor"
                    value={newPropValue}
                    onChange={(e) => setNewPropValue(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">
                Quantos imóveis visitou hoje?
              </Label>
              <Input type="number" min="1" value={qtd} onChange={(e) => setQtd(e.target.value)} />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-[#0070f3] hover:bg-[#005bb5] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Adicionar à Visita
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
