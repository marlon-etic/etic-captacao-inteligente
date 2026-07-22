import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { MapPin, Calendar, Home, MessageSquare, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/format-utils'

interface VisitDetailsModalProps {
  visit: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VisitDetailsModal({ visit, open, onOpenChange }: VisitDetailsModalProps) {
  const [feedback, setFeedback] = useState<any[]>([])
  const [visitRecords, setVisitRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchFeedback = useCallback(async () => {
    if (!visit?.demanda_id) {
      setFeedback([])
      setVisitRecords([])
      return
    }
    setLoading(true)
    try {
      const respostasRes = await supabase
        .from('respostas_captador')
        .select('id, resposta, observacao, motivo, created_at')
        .or(`demanda_locacao_id.eq.${visit.demanda_id},demanda_venda_id.eq.${visit.demanda_id}`)
        .order('created_at', { ascending: false })

      setFeedback(respostasRes.data || [])

      let vrData: any[] = []
      if (visit.imovel_id) {
        const { data: matches } = await supabase
          .from('imovel_demand_match')
          .select('id')
          .eq('imovel_id', visit.imovel_id)
          .eq('demanda_id', visit.demanda_id)

        if (matches && matches.length > 0) {
          const matchIds = matches.map((m) => m.id)
          const { data: vr } = await supabase
            .from('visit_records')
            .select('id, notes, visited_at, sdr_user_id')
            .in('property_link_id', matchIds)
            .order('visited_at', { ascending: false })
          vrData = vr || []
        }
      }
      setVisitRecords(vrData)
    } catch (err) {
      console.error('Error fetching feedback:', err)
    } finally {
      setLoading(false)
    }
  }, [visit?.demanda_id, visit?.imovel_id])

  useEffect(() => {
    if (open && visit) {
      fetchFeedback()
    }
  }, [open, visit, fetchFeedback])

  const property = visit?.imoveis_captados
  const address = property?.endereco || visit?.novo_imovel_endereco || 'Endereço não informado'
  const value = property?.preco || property?.valor || visit?.novo_imovel_valor || 0
  const visitDate = visit?.data_visita || visit?.created_at

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-[#1A3A52]">
            Detalhes da Visita
          </DialogTitle>
          <DialogDescription>
            Informações completas da visita agendada e do imóvel.
          </DialogDescription>
        </DialogHeader>

        {visit && (
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Código
                </p>
                <p className="font-bold text-gray-800">{property?.codigo_imovel || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Tipo
                </p>
                <p className="font-bold text-gray-800">
                  {property?.tipo_imovel || visit?.tipo_demanda || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Valor
                </p>
                <p className="font-bold text-emerald-600">
                  {value > 0 ? formatCurrency(value) : '—'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Localização
              </p>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">{address}</p>
                  {property?.localizacao_texto && (
                    <p className="text-sm text-gray-500 mt-1">{property.localizacao_texto}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Informações da Visita
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-700">
                    {visitDate ? format(new Date(visitDate), 'dd/MM/yyyy HH:mm') : 'Não agendada'}
                  </span>
                </div>
                {visit?.qtd_imoveis_visitados && (
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-700">
                      {visit.qtd_imoveis_visitados} imóvel(is) visitado(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {property?.fotos && property.fotos.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Fotos ({property.fotos.length})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                  {property.fotos.map((foto: string, idx: number) => (
                    <img
                      key={idx}
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="h-32 w-32 md:h-40 md:w-40 object-cover rounded-lg border border-gray-200 snap-center shadow-sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {property && (
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Características
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{property.tipo_imovel || 'Imóvel'}</Badge>
                  <Badge variant="outline">{property.dormitorios || 0} Quartos</Badge>
                  <Badge variant="outline">{property.vagas || 0} Vagas</Badge>
                  <Badge variant="outline">{property.banheiros || 0} Banheiros</Badge>
                  {property.etapa_funil && (
                    <Badge className="bg-blue-100 text-blue-800 border-none capitalize">
                      {property.etapa_funil}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {property?.observacoes && (
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                  Observações do Imóvel
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-md border border-gray-100 leading-relaxed whitespace-pre-wrap">
                  {property.observacoes}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Feedback e Observações
              </p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : feedback.length === 0 && visitRecords.length === 0 ? (
                <div className="text-sm text-gray-400 py-3 border border-dashed border-gray-200 rounded-lg text-center">
                  Nenhum feedback registrado para esta visita.
                </div>
              ) : (
                <div className="space-y-3">
                  {visitRecords.map((vr) => (
                    <div
                      key={vr.id}
                      className="bg-green-50/50 p-3 rounded-lg border border-green-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                          Registro de Visita
                        </span>
                        {vr.visited_at && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {format(new Date(vr.visited_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{vr.notes || 'Sem notas'}</p>
                    </div>
                  ))}
                  {feedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="bg-blue-50/50 p-3 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                          {fb.resposta || 'Resposta'}
                        </span>
                        {fb.created_at && (
                          <span className="text-xs text-gray-400 ml-auto">
                            {format(new Date(fb.created_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                      {fb.observacao && <p className="text-sm text-gray-700">{fb.observacao}</p>}
                      {fb.motivo && (
                        <p className="text-xs text-gray-500 mt-1">Motivo: {fb.motivo}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
