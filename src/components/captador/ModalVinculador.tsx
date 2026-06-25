import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { X, CheckSquare, Square, MapPin, Bed, Car, ExternalLink } from 'lucide-react'
import { Demand } from './BuscarDemandas'
import { calculateMatching, getScoreBadgeColor } from '@/lib/matching'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'

export function ModalVinculador({
  demanda,
  onClose,
  onVinculoSucesso,
}: {
  demanda: Demand | null
  onClose: () => void
  onVinculoSucesso: () => void
}) {
  const { user } = useAuth()
  const { role } = useUserRole()
  const { toast } = useToast()
  const [imoveis, setImoveis] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !role || !demanda) return
    const fetchImoveis = async () => {
      try {
        console.log('[VINCULAR] Buscando imóveis para role:', role)
        let query = supabase
          .from('imoveis_captados')
          .select(
            'id, codigo_imovel, endereco, localizacao_texto, preco, valor, tipo_imovel, tipo, dormitorios, vagas',
          )
          .is('demanda_locacao_id', null)
          .is('demanda_venda_id', null)

        if (role === 'sdr') {
          query = query.in('tipo', ['Locação', 'Aluguel', 'Ambos'])
        } else if (role === 'corretor' || role === 'broker') {
          query = query.in('tipo', ['Venda', 'Ambos'])
        } else if (role === 'captador') {
          query = query.eq('user_captador_id', user.id)
        }

        const { data, error } = await query

        if (error) throw error

        const dataWithScores = (data || [])
          .map((imovel) => {
            const matchResult = calculateMatching(imovel, {
              bairros: demanda.bairros || demanda.localizacoes,
              localizacoes: demanda.localizacoes || demanda.bairros,
              valor_minimo: demanda.valor_minimo || 0,
              valor_maximo: demanda.valor_maximo || demanda.orcamento_max || 0,
              orcamento_max: demanda.orcamento_max || demanda.valor_maximo || 0,
              dormitorios: demanda.dormitorios || demanda.quartos || 0,
              quartos: demanda.quartos || demanda.dormitorios || 0,
              vagas: demanda.vagas || demanda.vagas_estacionamento || 0,
              vagas_estacionamento: demanda.vagas_estacionamento || demanda.vagas || 0,
              tipo_imovel: demanda.tipo_imovel || '',
            })
            return {
              ...imovel,
              matchScore: matchResult.score,
            }
          })
          .sort((a, b) => b.matchScore - a.matchScore)

        setImoveis(dataWithScores)
      } catch (err: any) {
        console.error('[VINCULAR] Erro ao buscar imóveis:', err)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os imóveis.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchImoveis()
  }, [user, role, demanda, toast])

  if (!demanda) return null

  const handleConfirmar = async () => {
    if (selectedIds.size === 0) return
    setSaving(true)

    try {
      const updateData =
        demanda.tipo === 'locacao' || demanda.tipo === 'Locação' || demanda.tipo === 'Aluguel'
          ? { demanda_locacao_id: demanda.id, status_captacao: 'capturado' }
          : { demanda_venda_id: demanda.id, status_captacao: 'capturado' }

      const { error } = await supabase
        .from('imoveis_captados')
        .update(updateData)
        .in('id', Array.from(selectedIds))

      if (error) throw error

      toast({
        title: 'Sucesso!',
        description: `${selectedIds.size} imóvel(is) vinculado(s) com sucesso!`,
        className: 'bg-green-50 border-green-200 text-green-800',
      })
      onVinculoSucesso()
      onClose()
    } catch (err: any) {
      console.error('[VINCULAR] Erro na vinculação:', err)
      toast({
        title: 'Erro',
        description: 'Falha ao vincular imóveis.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-[650px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vincular Imóvel</h2>
            <p className="text-sm text-gray-500">
              Demanda: {demanda.nome_cliente || demanda.cliente_nome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500">Buscando imóveis disponíveis...</p>
            </div>
          ) : imoveis.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl opacity-50">🏠</div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum imóvel disponível</h3>
              <p className="mt-2 text-sm text-gray-500">
                Não há imóveis disponíveis para o seu perfil que possam ser vinculados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {imoveis.map((imovel) => {
                const isSelected = selectedIds.has(imovel.id)
                return (
                  <div
                    key={imovel.id}
                    onClick={() => toggleSelect(imovel.id)}
                    className={cn(
                      'flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300',
                    )}
                  >
                    <div className="pt-1 transition-transform active:scale-95">
                      {isSelected ? (
                        <CheckSquare className="text-blue-600" size={24} />
                      ) : (
                        <Square className="text-gray-300" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-md border border-gray-200">
                            #{imovel.codigo_imovel || 'S/N'}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-md">
                            {imovel.tipo_imovel || 'Imóvel'}
                          </span>
                        </div>
                        <Badge
                          className={cn('text-xs font-bold', getScoreBadgeColor(imovel.matchScore))}
                        >
                          {imovel.matchScore}% Match
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 mb-2">
                        <p className="text-sm font-bold text-gray-900">
                          R$ {(imovel.preco || imovel.valor || 0).toLocaleString('pt-BR')}
                        </p>
                        <div className="flex items-center justify-end gap-3 text-xs text-gray-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Bed size={14} className="text-gray-400" /> {imovel.dormitorios || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Car size={14} className="text-gray-400" /> {imovel.vagas || 0}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mb-2">
                        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5">
                          <MapPin size={14} className="text-pink-500 shrink-0" />
                          <span className="font-semibold text-gray-700">Bairro:</span>{' '}
                          {imovel.localizacao_texto || 'Não informado'}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5">
                          <MapPin size={14} className="text-transparent shrink-0" />
                          <span className="font-semibold text-gray-700">Localização:</span>{' '}
                          {imovel.endereco || 'Não informada'}
                        </p>
                      </div>

                      <div className="flex items-center justify-end mt-2 pt-3 border-t border-gray-100">
                        <a
                          href={getPropertyPublicUrl(imovel.codigo_imovel)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-bold bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100"
                        >
                          Ver Imóvel <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 bg-white border-t border-gray-100 rounded-b-xl shrink-0">
          <span className="text-sm font-medium text-gray-500">
            {selectedIds.size} selecionado(s)
          </span>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="font-bold border-gray-300">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={selectedIds.size === 0 || saving}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {saving ? 'Vinculando...' : 'Confirmar Vinculação'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
