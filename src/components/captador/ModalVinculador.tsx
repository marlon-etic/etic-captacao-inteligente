import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { X, CheckSquare, Square } from 'lucide-react'
import { Demand } from './BuscarDemandas'

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
  const { toast } = useToast()
  const [imoveis, setImoveis] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !demanda) return
    const fetchImoveis = async () => {
      try {
        console.log('[VINCULAR] Buscando imóveis disponíveis para o captador:', user.id)
        const { data, error } = await supabase
          .from('imoveis_captados')
          .select('id, codigo_imovel, endereco, preco, valor, tipo_imovel')
          .eq('user_captador_id', user.id)
          .is('demanda_locacao_id', null)
          .is('demanda_venda_id', null)

        if (error) throw error
        setImoveis(data || [])
        console.log('[VINCULAR] Imóveis encontrados:', data?.length)
      } catch (err: any) {
        console.error('[VINCULAR] Erro ao buscar imóveis:', err)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar seus imóveis.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchImoveis()
  }, [user, demanda, toast])

  if (!demanda) return null

  const handleConfirmar = async () => {
    if (selectedIds.size === 0) return
    setSaving(true)
    console.log(
      `[VINCULAR] Iniciando vinculação de ${selectedIds.size} imóveis à demanda ${demanda.id}`,
    )

    try {
      const updateData =
        demanda.tipo === 'locacao'
          ? { demanda_locacao_id: demanda.id, status_captacao: 'capturado' }
          : { demanda_venda_id: demanda.id, status_captacao: 'capturado' }

      const { error } = await supabase
        .from('imoveis_captados')
        .update(updateData)
        .in('id', Array.from(selectedIds))

      if (error) throw error

      console.log('[VINCULAR] Sucesso na vinculação!')
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
        description: 'Falha ao vincular imóveis. Verifique suas permissões.',
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
        className="bg-white rounded-xl shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 rounded-t-xl shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vincular Imóvel</h2>
            <p className="text-sm text-gray-500">Demanda: {demanda.nome_cliente}</p>
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
              <p className="mt-4 text-sm text-gray-500">Buscando seus imóveis disponíveis...</p>
            </div>
          ) : imoveis.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-4xl opacity-50">🏠</div>
              <h3 className="text-lg font-bold text-gray-900">Nenhum imóvel disponível</h3>
              <p className="mt-2 text-sm text-gray-500">
                Você não tem imóveis disponíveis para vincular ou todos já estão vinculados a outras
                demandas.
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
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="pt-1 transition-transform active:scale-95">
                      {isSelected ? (
                        <CheckSquare className="text-blue-600" size={24} />
                      ) : (
                        <Square className="text-gray-300" size={24} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-bold text-gray-600 bg-gray-100 rounded-md border border-gray-200">
                          #{imovel.codigo_imovel || 'S/N'}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-md">
                          {imovel.tipo_imovel || 'Imóvel'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {imovel.endereco || 'Endereço não informado'}
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        R$ {(imovel.preco || imovel.valor || 0).toLocaleString('pt-BR')}
                      </p>
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
